import type { VNode } from 'preact'
import { h } from 'preact'
import type { ArrayNode, EditorNode, NumberNode, ObjectNode, StringNode } from './types'

export function render(node: EditorNode): VNode {
	switch(node.type) {
		case 'string': return string(node)
		case 'number': return number(node)
		case 'object': return object(node)
		case 'array': return array(node)
	}
}

function string(node: StringNode): VNode {
	return h('div', { class: 'string-node' }, node.value)
}

function number(node: NumberNode): VNode {
	return h('div', { class: 'number-node' }, node.value)
}

const bodyNodes = new Set(['object', 'array'])

function object(node: ObjectNode): VNode {
	return h('div', { class: 'object-node' }, node.properties
		.map(p => h('div', { class: 'object-node-property', style: { display: bodyNodes.has(p.value.type) ? 'block' : 'flex' } }, [
			h('div', { class: 'object-node-key' }, p.key),
			h('div', { class: 'object-node-value' }, render(p.value)),
		])))
}

function array(node: ArrayNode): VNode {
	return h('div', { class: 'array-node' }, node.items
		.map(i => h('div', { class: 'array-node-item'}, render(i))))
}
