/** @param {NS} ns */
export function getTotalRam(ns, scripts) {
	let totalRam = []
	for (const script in scripts) {
		totalRam.push(ns.getScriptRam(script))
	}

	return totalRam
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

/** @param {NS} ns */
export function getServerStats(ns, server) {
	const stats = {
		minSecurity: ns.getServerMinSecurityLevel(server),
		currentSecurity: ns.getServerSecurityLevel(server),
		maxMoney: ns.getServerMaxMoney(server),
		currentMoney: ns.getServerMoneyAvailable(server),
	}

	return stats
}

/** @param {NS} ns */
export function chooseAction(ns, stats) {
	let action = ''
	if (stats.currentSecurity > stats.minSecurity) {
		action = 'weaken'
	} else if (stats.currentMoney < stats.maxMoney) {
		action = 'grow'
	} else {
		action = 'hack'
	}

	return action
}

/** @param {NS} ns */
export function makeAction(ns, action, server, target) {
	const scriptRam = ns.getScriptRam(`${action}.js`)
	const maxThreads = Math.floor(ns.getServerMaxRam(server) / scriptRam)

	if (maxThreads > 0) {
		ns.exec(`${action}.js`, server, maxThreads, target)
		return true
	} else {
		return false
	}
}
