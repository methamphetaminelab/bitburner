import {
	infectServers,
	getServerStats,
	chooseAction,
	makeAction,
} from './utils.js'

/** @param {NS} ns */
export async function main(ns) {
	ns.tail()
	ns.disableLog('ALL')
	const target = ns.args[0]
	const home = 'home'
	const hackers = ['hack.js', 'grow.js', 'weaken.js']
	const crackers = [
		ns.brutessh,
		ns.ftpcrack,
		ns.relaysmtp,
		ns.httpworm,
		ns.sqlinject,
	]

	const infectedServers = infectServers(ns, hackers, crackers, home)

	if (ns.scriptRunning('manager.js', home)) {
		ns.kill('manager.js', home)
	}

	while (true) {
		for (const server of infectedServers) {
			const stats = getServerStats(ns, target)
			const action = chooseAction(ns, stats)
			const totalRam =
				ns.getServerMaxRam(server) -
				ns.getServerUsedRam(server) -
				ns.getScriptRam(`${action}.js`)

			if (totalRam > 0) {
				const scriptRam = ns.getScriptRam(`${action}.js`)
				const maxThreads = Math.floor(totalRam / scriptRam)

				if (maxThreads > 0) {
					makeAction(ns, action, server, target)
					ns.print(`${server}: ${action} (x${maxThreads})`)
				}
			}
		}

		await ns.sleep(1)
	}
}
