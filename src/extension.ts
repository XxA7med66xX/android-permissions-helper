import * as vscode from 'vscode';
import { getPermissions } from './permissions';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('Permission.add', () => {
		showPermissionsMenu(context.extensionPath);
	});

	const codeActionProvider = vscode.languages.registerCodeActionsProvider('xml', new XmlCodeActionProvider(), {
		providedCodeActionKinds: XmlCodeActionProvider.providedCodeActionKinds
	});

	context.subscriptions.push(disposable);
}

async function showPermissionsMenu(extensionPath: string) {

	const quickPick = vscode.window.createQuickPick();
	quickPick.items = await getPermissions(extensionPath);
	quickPick.placeholder = 'Select permission to add';
	quickPick.matchOnDetail = true;
	quickPick.matchOnDescription = true;

	quickPick.onDidChangeSelection(item => {

		const selection = `<uses-permission android:name="android.permission.${item[0].label}"/>`;
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.active, selection);
			});
		}

		quickPick.dispose();

	});

	quickPick.onDidHide(() => {
		quickPick.dispose();
	});

	quickPick.show();
}

class XmlCodeActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		const fix = new vscode.CodeAction('Add permission', vscode.CodeActionKind.QuickFix);
		fix.command = { command: 'Permission.add', title: 'Add permission', arguments: [document.uri, range] };
		return [fix];
	}
}