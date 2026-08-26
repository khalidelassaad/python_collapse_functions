import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand(
        'python-collapse-functions.collapseAll',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const document = editor.document;
            if (document.languageId !== 'python') {
                return;
            }

            // 0. Expand all folds first (Ctrl+K, Ctrl+J)
            await vscode.commands.executeCommand('editor.unfoldAll');

            // 1. Get all folding ranges from the language provider
            const foldingRanges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
                'vscode.executeFoldingRangeProvider',
                document.uri
            );

            if (!foldingRanges || foldingRanges.length === 0) {
                vscode.window.showInformationMessage('No folding ranges found.');
                return;
            }

            // 2. Filter ranges that start with 'def' (ignoring leading whitespace)
            const defRanges = foldingRanges.filter(range => {
                const line = document.lineAt(range.start);
                const trimmed = line.text.trim();
                return trimmed.startsWith('def');
            });

            if (defRanges.length === 0) {
                vscode.window.showInformationMessage('No functions found to collapse.');
                return;
            }

            // 3. Build selections for each function range
            const selections = defRanges.map(range => {
                const start = new vscode.Position(range.start, 0);
                const end = new vscode.Position(range.end, 0);
                return new vscode.Selection(start, end);
            });

            // 4. Set multiple selections and fold them
            editor.selections = selections;
            await vscode.commands.executeCommand('editor.fold');

            // 5. (Optional) Clear selections or restore a single cursor
            // Here we set the cursor to the beginning of the first folded function.
            if (selections.length > 0) {
                editor.selection = new vscode.Selection(
                    selections[0].start,
                    selections[0].start
                );
            }
        }
    );

    context.subscriptions.push(command);
}

export function deactivate() {}