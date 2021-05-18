import { render as prender } from 'preact'
import { render } from './renderer'
import type { EditorBoundMessage, VsCode } from './types'

declare function acquireVsCodeApi(): VsCode
const vscode = acquireVsCodeApi()

window.addEventListener('message', e => {
	const msg = e.data as EditorBoundMessage
	switch(msg.type) {
		case 'update':
			console.log('Update visual editor', msg.root)
			prender(render(msg.root), root)
			break
	}
})

const root = document.createElement('div')
root.classList.add('root')
document.body.appendChild(root)

vscode.postMessage({ type: 'ready' })
