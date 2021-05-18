export type StringNode = {
	type: 'string',
	value: string,
}

export type NumberNode = {
	type: 'number',
	value: number,
}

export type ObjectNode = {
	type: 'object',
	properties: {
		key: string,
		value: EditorNode,
	}[],
}

export type ArrayNode = {
	type: 'array',
	items: EditorNode[],
}

export type EditorNode = StringNode | NumberNode | ObjectNode | ArrayNode

export type EditPath = (number | string)[]

export type Edit = {
	type: 'set',
	path: EditPath,
	new: EditorNode,
	old: EditorNode,
} | {
	type: 'remove' | 'add',
	path: EditPath,
	value: EditorNode,
} | {
	type: 'move',
	path: EditPath,
	target: EditPath,
}

export type EditorBoundMessage = {
	type: 'update',
	root: EditorNode,
}

export type HostBoundMessage = {
	type: 'ready',
} | {
	type: 'edit',
	edits: Edit[],
}

export type VsCode = {
	postMessage(message: HostBoundMessage): void,
}
