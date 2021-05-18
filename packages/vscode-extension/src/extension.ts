/* --------------------------------------------------------------------------------------------
 * This file is changed from Microsoft's sample:
 * https://github.com/microsoft/vscode-extension-samples/blob/master/lsp-sample/client/src/extension.ts
 * ------------------------------------------------------------------------------------------*/

import path from 'path'
import * as vsc from 'vscode'
import * as lc from 'vscode-languageclient/node'

let client: lc.LanguageClient

export function activate(context: vsc.ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('dist', 'server.js')
	)
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: lc.ServerOptions = {
		run: {
			module: serverModule,
			transport: lc.TransportKind.ipc,
		},
		debug: {
			module: serverModule,
			transport: lc.TransportKind.ipc,
			options: debugOptions,
		},
	}

	const documentSelector: lc.DocumentSelector = [
		{ scheme: 'file', language: 'mcfunction' },
		{ scheme: 'file', language: 'nbt' },
		{ scheme: 'file', language: 'nbtdoc' },
		// FIXME: The above three languages should be supported for other schemes as well.
		{ scheme: 'file', pattern: '**/pack.mcmeta' },
		{ scheme: 'file', pattern: '**/data/*/*/**/*.json' },
	]

	// Options to control the language client
	const clientOptions: lc.LanguageClientOptions = {
		documentSelector,
		initializationOptions: {},
		progressOnInitialization: true,
	}

	// Create the language client and start the client.
	client = new lc.LanguageClient(
		'spyglass',
		'SPYGlass Language Server',
		serverOptions,
		clientOptions
	)

	// Start the client. This will also launch the server
	client.start()

	client.onReady().then(() => { })

	vsc.commands.registerCommand('datapack.visualEditor', () => {
		const editor = vsc.window.activeTextEditor
		if (editor) {
			createVisualEditor(editor, context)
		}
	})
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined
	}
	return client.stop()
}

function createVisualEditor(editor: vsc.TextEditor, context: vsc.ExtensionContext) {
	const panel = vsc.window.createWebviewPanel('datapackVisualEditor', 'Visual Editor', vsc.ViewColumn.Beside, { enableScripts: true })

	panel.webview.onDidReceiveMessage(msg => {
		switch(msg.type) {
			case 'ready':
				panel.webview.postMessage({
					type: 'update',
					root: testEditorNode,
				})
				break
		}
	})

	const asset = (...folders: string[]) => panel.webview.asWebviewUri(
		vsc.Uri.file(path.join(context.extensionPath, ...folders)))
	const scriptUri = asset('dist', 'editor.js')
	const styleUri = asset('resource', 'editor.css')
	const nonce = getNonce()

	panel.webview.html = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; img-src ${panel.webview.cspSource} https:; script-src 'nonce-${nonce}';">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${styleUri}" rel="stylesheet" />
			<title>Visual Editor</title>
		</head>
			<body>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`	
}

function getNonce() {
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

const testEditorNode = {
	type: 'object',
	properties: [
		{
			key: 'Name',
			value: {
				type: 'string',
				value: 'stone',
			},
		},
		{
			key: 'Value',
			value: {
				type: 'object',
				properties: [
					{
						key: 'Nested',
						value: {
							type: 'array',
							items: [
								{
									type: 'number',
									value: 123,
								},
								{
									type: 'string',
									value: 'foo',
								},
							],
						},
					},
					{
						key: 'Bar',
						value: {
							type: 'number',
							value: 456,
						},
					},
				],
			},
		},
	],
}
