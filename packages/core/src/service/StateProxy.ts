import { emplaceMap } from '../common/index.js'
import { Operations } from './Operations.js'

const BranchOff = Symbol('StateBranchOff')
const Is = Symbol('IsStateProxy')
const Origin = Symbol('OriginState')
const Redo = Symbol('RedoStateChanges')
const Undo = Symbol('UndoStateChanges')

/**
 * A proxy wrapped around an arbitrary object value.
 * You can access and mutate the value as normal, but you also have the ability to revert all changes ever since the
 * proxy was created using {@link StateProxy.redoChanges} and {@link StateProxy.undoChanges}.
 * 
 * A new proxy can be branched off of an existing proxy using {@link StateProxy.branchOff} to have finer control
 * over what changes to be reverted.
 */
export type StateProxy<T extends object> = {
	[K in keyof T]: T[K] extends object ? StateProxy<T[K]> : T[K]
} & {
	[BranchOff]: () => StateProxy<T>,
	[Is]: true,
	[Origin]: T,
	[Redo]: () => void,
	[Undo]: () => void,
}

export const StateProxy: {
	branchOff<T extends object>(proxy: StateProxy<T>): StateProxy<T>,
	create<T extends object>(obj: T): T extends StateProxy<any> ? (void & { _cannotCreateProxyFromProxy: never }) : StateProxy<T>,
	dereference<T extends object>(value: StateProxy<T> | T): T,
	is(obj: any): obj is StateProxy<object>,
	redoChanges(proxy: StateProxy<object>): void,
	undoChanges(proxy: StateProxy<object>): void,
} = Object.freeze({
	branchOff<T extends object>(proxy: StateProxy<T>): StateProxy<T> {
		return proxy[BranchOff]()
	},
	create<T extends object>(obj: T): any {
		if (StateProxy.is(obj)) {
			throw new Error('Cannot create a proxy over a proxy. You might want to use branchOff instead.')
		}
		return _createStateProxy(obj, new Operations())
	},
	dereference<T extends object>(value: StateProxy<T> | T): T {
		return StateProxy.is(value) ? value[Origin] : value
	},
	is(obj: any): obj is StateProxy<object> {
		return obj?.[Is]
	},
	redoChanges(proxy: StateProxy<object>): void {
		proxy[Redo]()
	},
	undoChanges(proxy: StateProxy<object>): void {
		proxy[Undo]()
	},
})

class StateProxyHandler<T extends object> implements ProxyHandler<T> {
	private readonly map = new Map<string | symbol, StateProxy<object>>()

	constructor(
		/**
		 * Shared across all handlers created for the same root state object under the same branch.
		 */
		private readonly rootOps: Operations,
	) { }

	#branchOff(target: T): StateProxy<T> {
		return _createStateProxy(target, new Operations(this.rootOps))
	}

	get(target: T, p: string | symbol, receiver: any): any {
		switch (p) {
			case BranchOff: return () => this.#branchOff(target)
			case Is: return true
			case Origin: return target
			case Redo: return () => this.rootOps.redo()
			case Undo: return () => this.rootOps.undo()
		}
		const value = Reflect.get(target, p, receiver)
		if (value && typeof value === 'object') {
			const ans = emplaceMap(this.map, p, {
				insert: () => _createStateProxy(value, this.rootOps),
			})
			return ans
		}
		return value
	}

	set(target: T, p: string | symbol, value: any, receiver: any): boolean {
		if (p === BranchOff || p === Is || p === Origin || p === Redo || p === Undo) {
			throw new Error(`Cannot set ${String(p)}`)
		}
		this.rootOps.set(target, p as keyof T, StateProxy.dereference(value), receiver)
		return true
	}
}

function _createStateProxy<T extends object>(target: T, operations: Operations): StateProxy<T> {
	return new Proxy(target, new StateProxyHandler(operations)) as StateProxy<T>
}
