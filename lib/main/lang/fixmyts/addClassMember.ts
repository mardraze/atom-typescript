import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ts from "typescript";
import * as ast from "./astUtils";
import {EOL} from "os";
import {displayPartsToString, typeToDisplayParts} from "typescript";

function getIdentifierAndClassNames(error: ts.Diagnostic) {
    var errorText: string = <any>error.messageText;
    if (typeof errorText !== 'string') {
        console.error('I have no idea what this is:', errorText);
        return undefined;
    };

    // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
    var match = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./);

    // Happens when the type name is an alias. We can't refactor in this case anyways
    if (!match) return;

    var [, identifierName, className] = match;
    return { identifierName, className };
}

class AddClassMember implements QuickFix {
    key = AddClassMember.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        // TODO: use type checker to see if item of `.` before hand is a class
        //  But for now just run with it.

        var match = getIdentifierAndClassNames(relevantError);

        if(!match) return;

        var {identifierName, className} = match;
        return `Add ${identifierName} to ${className}`;
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        var identifier = <ts.Identifier>info.positionNode;

        var identifierName = identifier.text;
        var {className} = getIdentifierAndClassNames(relevantError);

        // Get the type of the stuff on the right if its an assignment
        var typeString = 'any';
        var parentOfParent = identifier.parent.parent;
        if (parentOfParent.kind == ts.SyntaxKind.BinaryExpression
            && (<ts.BinaryExpression>parentOfParent).operatorToken.getText().trim() == '=') {

            let binaryExpression = <ts.BinaryExpression>parentOfParent;
            var type = info.typeChecker.getTypeAtLocation(binaryExpression.right);

            /** Discoverd from review of `services.getQuickInfoAtPosition` */
            typeString = displayPartsToString(typeToDisplayParts(info.typeChecker, type)).replace(/\s+/g, ' ');
        }

        // Find the containing class declaration
        var memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, className);
        if (!memberTarget) {
            // Find the containing interface declaration
            memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.InterfaceDeclaration, className);
        }
        if (!memberTarget) {
            return [];
        }

        // The following code will be same (and typesafe) for either class or interface
        let targetDeclaration = <ts.ClassDeclaration|ts.InterfaceDeclaration>memberTarget;

        // Then the first brace
        let firstBrace = targetDeclaration.getChildren().filter(x=> x.kind == ts.SyntaxKind.OpenBraceToken)[0];

        // And the correct indent
        var indentLength = info.service.getIndentationAtPosition(
            memberTarget.getSourceFile().fileName, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');

        // And add stuff after the first brace
        let refactoring: Refactoring = {
            span: {
                start: firstBrace.end,
                length: 0
            },
            newText: `${EOL}${indent}${identifierName}: ${typeString};`,
            filePath: targetDeclaration.getSourceFile().fileName
        };

        return [refactoring];
    }
}

export default AddClassMember;
