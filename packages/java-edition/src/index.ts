import * as core from '@spyglassmc/core'
import * as nbt from '@spyglassmc/nbt'
import * as nbtdoc from '@spyglassmc/nbtdoc'
import { uriBinder } from './binder'
import type { McmetaSummary } from './dependency'
import { getMcmetaSummary, getMcNbtdoc, getVersions, PackMcmeta, resolveConfiguredVersion, symbolRegistrar } from './dependency'
import * as jeJson from './json'
import * as jeMcf from './mcfunction'

export * as dependency from './dependency'
export * as json from './json'
export * as mcf from './mcfunction'

export const initialize: core.ProjectInitializer = async (ctx) => {
	async function getPackMcmeta(): Promise<PackMcmeta | undefined> {
		let ans: PackMcmeta | undefined
		const uri = `${projectRoot}pack.mcmeta`
		try {
			const data = await core.fileUtil.readJson(uri)
			PackMcmeta.assert(data)
			ans = data
		} catch (e) {
			if (!core.isEnoent(e)) {
				// `pack.mcmeta` exists but broken. Log an error.
				logger.error(`[je.initialize] Failed loading pack.mcmeta “${uri}”`, e)
			}
		}
		return ans
	}

	const { config, downloader, logger, meta, projectRoot } = ctx

	meta.registerUriBinder(uriBinder)

	const versions = await getVersions(ctx.downloader)
	if (!versions) {
		ctx.logger.error('[je-initialize] Failed loading game version list. Expect everything to be broken.')
		return
	}

	const packMcmeta = await getPackMcmeta()
	const { major, id: version, isLatest } = resolveConfiguredVersion(config.env.gameVersion, { packMcmeta, versions })

	meta.registerDependencyProvider('@mc-nbtdoc', () => getMcNbtdoc(downloader, version, isLatest))

	const summary = await getMcmetaSummary(downloader, logger, version, isLatest, config.env.dataSource, config.env.mcmetaSummaryOverrides)
	if (!summary.blocks || !summary.commands || !summary.fluids || !summary.registries) {
		ctx.logger.error('[je-initialize] Failed loading mcmeta summaries. Expect everything to be broken.')
		return
	}

	meta.registerSymbolRegistrar('mcmeta-summary', {
		checksum: summary.checksum,
		registrar: symbolRegistrar(summary as McmetaSummary),
	})

	meta.registerLinter('nameOfNbtKey', {
		configValidator: core.linter.configValidator.nameConvention,
		linter: core.linter.nameConvention('value'),
		nodePredicate: n => (
			// nbt compound keys without nbtdoc definition.
			(!n.symbol && n.parent?.parent?.type === 'nbt:compound' && core.PairNode.is(n.parent) && n.type === 'string' && n.parent.key === n) ||
			// nbt path keys without nbtdoc definition.
			(!n.symbol && n.parent?.type === 'nbt:path' && n.type === 'string') ||
			// nbtdoc compound key definition outside of `::minecraft` modules.
			(nbtdoc.CompoundFieldNode.is(n.parent) && nbtdoc.CompoundFieldKey.is(n) && !n.symbol?.path[0]?.startsWith('::minecraft'))
		),
	})

	jeJson.initialize(ctx)
	jeMcf.initialize(ctx, summary.commands, major)
	nbt.initialize(ctx)

	return {
		loadedVersion: major,
	}
}
