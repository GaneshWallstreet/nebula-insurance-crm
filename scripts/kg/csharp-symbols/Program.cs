// Symbol-layer extractor for C#. Invoked by scripts/kg/symbols.py.
// Reads a JSON array of repo-relative file paths from stdin, parses them
// with Roslyn into a single CSharpCompilation, and emits a JSON array of
// symbol records to stdout. Each method/property/constructor record carries:
//
//   calls       — resolved {name, container} for invocations whose target
//                 symbol the semantic model can determine. Falls back to
//                 {name, container: null} when the target is external
//                 (framework/EF/etc.) or otherwise unresolved.
//   implements  — {name, container} for every interface member this method
//                 satisfies. Lets symbols.py grow polymorphic-dispatch groups
//                 so reaching an interface member reaches its implementations.
//
// The compilation is built without metadata references — we only care about
// resolving calls between application source symbols. Framework calls are
// expected to be unresolved (container: null) and are ignored by the
// reachability walk.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace CSharpSymbols;

public sealed record CallRef(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("container")] string? Container
);

public sealed record SymbolItem(
    [property: JsonPropertyName("file")] string File,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("container")] string? Container,
    [property: JsonPropertyName("kind")] string Kind,
    [property: JsonPropertyName("line")] int Line,
    [property: JsonPropertyName("signature")] string Signature,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("calls")] CallRef[] Calls,
    [property: JsonPropertyName("implements")] CallRef[] Implements
);

public static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        WriteIndented = false,
    };

    public static int Main(string[] args)
    {
        try { return Run(); }
        catch (Exception ex)
        {
            Console.Error.WriteLine("extractor crashed: " + ex);
            return 1;
        }
    }

    private static int Run()
    {
        var stdin = Console.In.ReadToEnd();
        string[] files;
        try
        {
            files = JsonSerializer.Deserialize<string[]>(stdin) ?? Array.Empty<string>();
        }
        catch (JsonException ex)
        {
            Console.Error.WriteLine("invalid stdin JSON: " + ex.Message);
            return 1;
        }

        var trees = new List<(string Rel, SyntaxTree Tree)>(files.Length);
        foreach (var rel in files)
        {
            string source;
            try { source = File.ReadAllText(rel); }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"read failed {rel}: {ex.Message}");
                continue;
            }

            try
            {
                var tree = CSharpSyntaxTree.ParseText(SourceText.From(source), path: rel);
                trees.Add((rel, tree));
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"parse failed {rel}: {ex.Message}");
            }
        }

        // Single compilation across every input file so SemanticModel can
        // resolve cross-file references. No metadata refs needed — we only
        // care about resolving calls between application source symbols.
        var compilation = CSharpCompilation.Create(
            "NebulaKgSymbols",
            syntaxTrees: trees.Select(t => t.Tree),
            references: null,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        var items = new List<SymbolItem>(capacity: trees.Count * 8);

        foreach (var (rel, tree) in trees)
        {
            var root = (CompilationUnitSyntax)tree.GetRoot();
            var model = compilation.GetSemanticModel(tree);

            foreach (var member in EnumerateTopLevelMembers(root))
            {
                EmitMember(rel, container: null, member, items, model);
            }
        }

        Console.Out.Write(JsonSerializer.Serialize(items, JsonOptions));
        return 0;
    }

    private static IEnumerable<MemberDeclarationSyntax> EnumerateTopLevelMembers(CompilationUnitSyntax root)
    {
        foreach (var m in root.Members)
        {
            if (m is BaseNamespaceDeclarationSyntax ns)
            {
                foreach (var inner in ns.Members) yield return inner;
            }
            else
            {
                yield return m;
            }
        }
    }

    private static void EmitMember(
        string rel, string? container, MemberDeclarationSyntax member,
        List<SymbolItem> items, SemanticModel model)
    {
        switch (member)
        {
            case TypeDeclarationSyntax type:
                EmitType(rel, container, type, items, model);
                break;
            case EnumDeclarationSyntax e:
                items.Add(new SymbolItem(
                    File: rel,
                    Name: e.Identifier.ValueText,
                    Container: container,
                    Kind: "enum",
                    Line: LineOf(e),
                    Signature: Signature(e),
                    Visibility: VisibilityOf(e.Modifiers),
                    Calls: Array.Empty<CallRef>(),
                    Implements: Array.Empty<CallRef>()));
                break;
            case DelegateDeclarationSyntax d:
                items.Add(new SymbolItem(
                    File: rel,
                    Name: d.Identifier.ValueText,
                    Container: container,
                    Kind: "delegate",
                    Line: LineOf(d),
                    Signature: Signature(d),
                    Visibility: VisibilityOf(d.Modifiers),
                    Calls: Array.Empty<CallRef>(),
                    Implements: Array.Empty<CallRef>()));
                break;
        }
    }

    private static void EmitType(
        string rel, string? container, TypeDeclarationSyntax type,
        List<SymbolItem> items, SemanticModel model)
    {
        var name = type.Identifier.ValueText;
        var kind = type switch
        {
            InterfaceDeclarationSyntax => "interface",
            RecordDeclarationSyntax => "record",
            StructDeclarationSyntax => "struct",
            _ => "class",
        };

        items.Add(new SymbolItem(
            File: rel,
            Name: name,
            Container: container,
            Kind: kind,
            Line: LineOf(type),
            Signature: Signature(type),
            Visibility: VisibilityOf(type.Modifiers),
            Calls: Array.Empty<CallRef>(),
            Implements: Array.Empty<CallRef>()));

        foreach (var member in type.Members)
        {
            switch (member)
            {
                case TypeDeclarationSyntax nested:
                    EmitType(rel, name, nested, items, model);
                    break;
                case EnumDeclarationSyntax e:
                    items.Add(new SymbolItem(
                        File: rel,
                        Name: e.Identifier.ValueText,
                        Container: name,
                        Kind: "enum",
                        Line: LineOf(e),
                        Signature: Signature(e),
                        Visibility: VisibilityOf(e.Modifiers),
                        Calls: Array.Empty<CallRef>(),
                        Implements: Array.Empty<CallRef>()));
                    break;
                case MethodDeclarationSyntax m:
                    items.Add(new SymbolItem(
                        File: rel,
                        Name: m.Identifier.ValueText,
                        Container: name,
                        Kind: "method",
                        Line: LineOf(m),
                        Signature: Signature(m),
                        Visibility: VisibilityOf(m.Modifiers),
                        Calls: ResolvedCalls(m, model),
                        Implements: ImplementsOf(m, model)));
                    break;
                case PropertyDeclarationSyntax p:
                    items.Add(new SymbolItem(
                        File: rel,
                        Name: p.Identifier.ValueText,
                        Container: name,
                        Kind: "property",
                        Line: LineOf(p),
                        Signature: Signature(p),
                        Visibility: VisibilityOf(p.Modifiers),
                        Calls: ResolvedCalls(p, model),
                        Implements: Array.Empty<CallRef>()));
                    break;
                case ConstructorDeclarationSyntax ctor:
                    // Emit constructor with synthetic name ".ctor" so its symbol
                    // id is distinct from the type's symbol id.
                    items.Add(new SymbolItem(
                        File: rel,
                        Name: ".ctor",
                        Container: name,
                        Kind: "constructor",
                        Line: LineOf(ctor),
                        Signature: Signature(ctor),
                        Visibility: VisibilityOf(ctor.Modifiers),
                        Calls: ResolvedCalls(ctor, model),
                        Implements: Array.Empty<CallRef>()));
                    break;
            }
        }
    }

    private static int LineOf(SyntaxNode node) =>
        node.GetLocation().GetLineSpan().StartLinePosition.Line + 1;

    private static string VisibilityOf(SyntaxTokenList modifiers)
    {
        var hasPublic = false;
        var hasInternal = false;
        var hasProtected = false;
        var hasPrivate = false;
        foreach (var m in modifiers)
        {
            if (m.IsKind(SyntaxKind.PublicKeyword)) hasPublic = true;
            else if (m.IsKind(SyntaxKind.InternalKeyword)) hasInternal = true;
            else if (m.IsKind(SyntaxKind.ProtectedKeyword)) hasProtected = true;
            else if (m.IsKind(SyntaxKind.PrivateKeyword)) hasPrivate = true;
        }
        if (hasPublic) return "public";
        if (hasInternal) return "internal";
        if (hasProtected) return "protected";
        if (hasPrivate) return "private";
        return "internal";
    }

    private static string Signature(MemberDeclarationSyntax node)
    {
        int start = int.MaxValue;
        if (node.Modifiers.Count > 0)
        {
            start = Math.Min(start, node.Modifiers[0].SpanStart);
        }
        foreach (var child in node.ChildNodes())
        {
            if (child is AttributeListSyntax) continue;
            start = Math.Min(start, child.SpanStart);
        }
        if (start == int.MaxValue || start < node.SpanStart) start = node.SpanStart;
        var end = node.Span.End;
        var text = node.SyntaxTree.GetText().ToString(new Microsoft.CodeAnalysis.Text.TextSpan(start, end - start));
        var cut = text.Length;
        var braceIdx = text.IndexOf('{');
        if (braceIdx > 0) cut = Math.Min(cut, braceIdx);
        var arrowIdx = text.IndexOf("=>", StringComparison.Ordinal);
        if (arrowIdx > 0) cut = Math.Min(cut, arrowIdx);
        var semiIdx = text.IndexOf(';');
        if (semiIdx > 0) cut = Math.Min(cut, semiIdx);
        var nlIdx = text.IndexOf('\n');
        if (nlIdx > 0) cut = Math.Min(cut, nlIdx);
        return text.Substring(0, cut).Trim();
    }

    private static CallRef[] ResolvedCalls(SyntaxNode body, SemanticModel model)
    {
        // De-duplicate on (name, container) so we don't emit the same edge twice
        // when the same method is invoked from multiple call sites in the body.
        var seen = new HashSet<(string Name, string? Container)>();
        var result = new List<CallRef>();

        foreach (var inv in body.DescendantNodes().OfType<InvocationExpressionSyntax>())
        {
            var info = model.GetSymbolInfo(inv);
            var symbol = info.Symbol as IMethodSymbol
                ?? info.CandidateSymbols.OfType<IMethodSymbol>().FirstOrDefault();

            string name;
            string? container;
            if (symbol is not null)
            {
                // Reduced symbol drops extension-method receiver substitution so
                // we report the actual method name a reader would grep for.
                var reduced = symbol.ReducedFrom ?? symbol;
                name = reduced.Name;
                container = reduced.ContainingType?.Name;
            }
            else
            {
                name = ExtractCallName(inv) ?? "";
                container = null;
                if (string.IsNullOrEmpty(name)) continue;
            }

            if (seen.Add((name, container)))
            {
                result.Add(new CallRef(name, container));
            }
        }

        return result.ToArray();
    }

    private static string? ExtractCallName(InvocationExpressionSyntax inv) => inv.Expression switch
    {
        IdentifierNameSyntax id => id.Identifier.ValueText,
        MemberAccessExpressionSyntax ma => ma.Name.Identifier.ValueText,
        GenericNameSyntax gn => gn.Identifier.ValueText,
        MemberBindingExpressionSyntax mb => mb.Name.Identifier.ValueText,
        _ => null,
    };

    private static CallRef[] ImplementsOf(MethodDeclarationSyntax method, SemanticModel model)
    {
        if (model.GetDeclaredSymbol(method) is not IMethodSymbol symbol)
            return Array.Empty<CallRef>();

        var refs = new List<CallRef>();

        // Explicit interface implementations (e.g., void IFoo.Bar() { ... }).
        foreach (var explicitImpl in symbol.ExplicitInterfaceImplementations)
        {
            if (explicitImpl.ContainingType is { } t)
                refs.Add(new CallRef(explicitImpl.Name, t.Name));
        }

        // Implicit interface implementations. For each interface the containing
        // type implements, check whether this method is the implementing member.
        var containingType = symbol.ContainingType;
        if (containingType is not null)
        {
            foreach (var iface in containingType.AllInterfaces)
            {
                foreach (var ifaceMember in iface.GetMembers().OfType<IMethodSymbol>())
                {
                    if (ifaceMember.Name != symbol.Name) continue;
                    var impl = containingType.FindImplementationForInterfaceMember(ifaceMember);
                    if (SymbolEqualityComparer.Default.Equals(impl, symbol))
                    {
                        refs.Add(new CallRef(ifaceMember.Name, iface.Name));
                    }
                }
            }
        }

        // Overridden virtual/abstract base method — same dispatch concern.
        if (symbol.OverriddenMethod is { ContainingType: { } baseType } overridden)
        {
            refs.Add(new CallRef(overridden.Name, baseType.Name));
        }

        return refs
            .GroupBy(r => (r.Name, r.Container))
            .Select(g => g.First())
            .ToArray();
    }
}
