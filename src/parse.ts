import type { Agent, Command } from './agents'
import { AGENTS } from './agents'
import { exclude } from './utils'
import type { Runner } from './runner'

export class UnsupportedCommand extends Error {
  constructor({ agent, command }: { agent: Agent; command: Command }) {
    super(`Command "${command}" is not support by agent "${agent}"`)
  }
}

export function getCommand(
  agent: Agent,
  command: Command,
  args: string[] = [],
) {
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  const c = AGENTS[agent][command]
  if (!c)
    throw new UnsupportedCommand({ agent, command })

  let cmd = ''

  if (typeof c === 'function') {
    cmd = c(args)
  }
  else {
    const quote = (arg: string) => (!arg.startsWith('--') && arg.includes(' '))
      ? JSON.stringify(arg)
      : arg
    cmd = c.replace('{0}', args.map(quote).join(' ')).trim()
  }

  // DEBUG: remove for build
  // eslint-disable-next-line no-console
  console.log('>', cmd)

  return cmd
}

export const parseNi = <Runner>((agent, args, ctx) => {
  // bun use `-d` instead of `-D`, #90
  if (agent === 'bun')
    args = args.map(i => i === '-D' ? '-d' : i)

  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)
  }

  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  return getCommand(agent, 'add', args)
})

export const parseNr = <Runner>((agent, args) => {
  if (args.length === 0)
    args.push('start')

  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    args[0] = `--if-present ${args[0]}`
  }

  return getCommand(agent, 'run', args)
})

export const parseNu = <Runner>((agent, args) => {
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  return getCommand(agent, 'upgrade', args)
})

export const parseNun = <Runner>((agent, args) => {
  if (args.includes('-g'))
    return getCommand(agent, 'global_uninstall', exclude(args, '-g'))
  return getCommand(agent, 'uninstall', args)
})

export const parseNlx = <Runner>((agent, args) => {
  return getCommand(agent, 'execute', args)
})

export const parseNrx = <Runner>((agent, args) => {
  return getCommand(agent, 'bin', args)
})

export const parseNa = <Runner>((agent, args) => {
  return getCommand(agent, 'agent', args)
})
