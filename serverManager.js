/** @param {NS} ns */
export async function main(ns) {
	const arg = ns.args[0]
	const serv = ns.args[1]
	const serverRam = ns.args[2]

	if (!arg && !serv) {
		ns.tprint(
			'run serverManager.js [list|buy|delete|upgrade] [serverIndex|RAM(GB)] [RAM(GB)]'
		)
	} else {
		let servers = ns.getPurchasedServers()

		if (arg == 'list') {
			for (const server of servers) {
				ns.tprint(server)
			}
		} else if (arg == 'delete') {
			if (!serv) {
				ns.tprint('run serverManager.js delete [serverIndex]')
			} else {
				if (ns.deleteServer(servers[serv]))
					ns.tprint('server successfully deleted')
				else ns.tprint('error')
			}
		} else if (arg == 'buy') {
			if (!serv) ns.tprint('run serverManager.js buy [RAM(GB)]')
			else if (ns.getPurchasedServerLimit() == ns.getPurchasedServers().length)
				ns.tprint('maximum number of servers reached')
			else if (ns.getPlayer().money < ns.getPurchasedServerCost())
				ns.tprint(
					`not enough money (${Math.round(
						ns.getPlayer().money
					)}/${ns.getPurchasedServerCost(server, serverRam)})`
				)
			else {
				if (ns.purchaseServer('00000000000000', serv)) {
					ns.renamePurchasedServer(
						'00000000000000',
						`[${servers.length}] server ${serv}GB`
					)
					ns.tprint('server successfully purchased')
				} else ns.tprint('error')
			}
		} else if (arg == 'upgrade') {
			if (!serv) {
				ns.tprint('run serverManager.js upgrade [serverIndex|all] [RAM]')
			} else if (serv == 'all') {
				for (const server of servers) {
					if (ns.getServerMaxRam(server) == serverRam)
						ns.tprint(
							`server (${server}) has the same number of RAM or less (${ns.getServerMaxRam(
								server
							)}/${serverRam})`
						)
					else if (ns.upgradePurchasedServer(server, serverRam)) {
						ns.renamePurchasedServer(
							server,
							`[${servers.indexOf(server)}] server ${serverRam}GB`
						)
						ns.tprint(
							`server ${servers.indexOf(server)}/${
								servers.length - 1
							} successfully upgraded`
						)
					} else if (
						ns.getPlayer().money <
						ns.getPurchasedServerUpgradeCost(server, serverRam)
					)
						ns.tprint(
							`not enough money (${Math.round(
								ns.getPlayer().money
							)}/${ns.getPurchasedServerUpgradeCost(server, serverRam)})`
						)
					else ns.tprint('error')
				}
			} else {
				if (ns.upgradePurchasedServer(servers[serv], serverRam)) {
					ns.renamePurchasedServer(
						servers[serv],
						`[${serv}] server ${serverRam}GB`
					)
					ns.tprint('server successfully upgraded')
				}
			}
		}
	}
}
