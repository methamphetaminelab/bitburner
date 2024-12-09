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

	let actionsQueue = []

	while (true) {
		actionsQueue = []
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
					actionsQueue.push({ action, server, target, maxThreads })
				}
			}
		}

		await executeActions(ns, actionsQueue)

		await ns.sleep(1)
	}
}

/** @param {NS} ns */
export function getServerStats(ns, server) {
	return {
		minSecurity: ns.getServerMinSecurityLevel(server),
		currentSecurity: ns.getServerSecurityLevel(server),
		maxMoney: ns.getServerMaxMoney(server),
		currentMoney: ns.getServerMoneyAvailable(server),
	}
}

/** @param {NS} ns */
export function chooseAction(ns, stats) {
	if (stats.currentSecurity > stats.minSecurity) {
		return 'weaken'
	} else if (stats.currentMoney < stats.maxMoney * 0.95) {
		return 'grow'
	} else {
		return 'hack'
	}
}

/** @param {NS} ns */
export async function executeActions(ns, actionsQueue) {
	const promises = actionsQueue.map(
		async ({ action, server, target, maxThreads }) => {
			const success = await makeAction(ns, action, server, target, maxThreads)
			if (success) {
				ns.print(`${server}: Executed ${action} with ${maxThreads} threads`)
			} else {
				ns.print(`${server}: Failed to execute ${action}`)
			}
		}
	)

	await Promise.all(promises)
}

/** @param {NS} ns */
export async function makeAction(ns, action, server, target, maxThreads) {
	const scriptRam = ns.getScriptRam(`${action}.js`)
	const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)

	if (availableRam >= scriptRam * maxThreads) {
		const success = ns.exec(`${action}.js`, server, maxThreads, target)
		if (!success) {
			ns.print(`${server}: Failed to execute ${action}, retrying in 5s...`)
			await ns.sleep(5000)
			return await makeAction(ns, action, server, target, maxThreads)
		}
		return true
	}
	return false
}

/** @param {NS} ns */
export function getServers(ns, home) {
	const visited = new Set()
	const servers = []

	function scan(server) {
		if (visited.has(server)) {
			return
		}
		if (server != 'home') {
			visited.add(server)
			servers.push(server)
		}

		const connectedServers = ns.scan(server)
		for (const connectedServer of connectedServers) {
			scan(connectedServer)
		}
	}

	scan(home)
	return servers
}

/** @param {NS} ns */
export function tryInfect(ns, server, crackers) {
	for (const cracker of crackers) {
		if (cracker) {
			try {
				cracker(server)
			} catch (err) {
				ns.print(`${server}: ${err}`)
			}
		}
	}

	if (!ns.hasRootAccess(server)) {
		try {
			ns.nuke(server)
			return ns.hasRootAccess(server)
		} catch (err) {
			ns.print(`${server}: ${err}`)
			return false
		}
	}

	return ns.hasRootAccess(server)
}

/** @param {NS} ns */
export function infectServers(ns, hackers, crackers, home) {
	const servers = getServers(ns, home)
	let infectedServers = []

	for (const server of servers) {
		if (tryInfect(ns, server, crackers)) {
			ns.scp(hackers, server)
			infectedServers.push(server)
			ns.killall(server)
		}
	}

	return infectedServers
}
