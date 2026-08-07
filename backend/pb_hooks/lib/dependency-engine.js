/** 任务依赖图纯逻辑；服务端 Hook 与任务流页面共用。 */
const topologicalSort = (nodes, edges) => {
  const ids = nodes.map((node) => node.id)
  const indegree = Object.fromEntries(ids.map((id) => [id, 0]))
  const outgoing = Object.fromEntries(ids.map((id) => [id, []]))
  for (const edge of edges) {
    if (!(edge.to in indegree) || !(edge.from in indegree)) continue
    outgoing[edge.from].push(edge.to)
    indegree[edge.to] += 1
  }
  const queue = ids.filter((id) => indegree[id] === 0)
  const result = []
  while (queue.length) {
    const id = queue.shift()
    result.push(id)
    for (const next of outgoing[id]) {
      indegree[next] -= 1
      if (indegree[next] === 0) queue.push(next)
    }
  }
  if (result.length !== ids.length) throw new Error('dependency cycle detected')
  return result
}

const affectedDownstream = (start, edges) => {
  const outgoing = new Map()
  for (const edge of edges) {
    if (edge.type !== 'hard') continue
    const list = outgoing.get(edge.from) || []
    list.push(edge.to)
    outgoing.set(edge.from, list)
  }
  const seen = new Set()
  const queue = [...(outgoing.get(start) || [])]
  while (queue.length) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    queue.push(...(outgoing.get(id) || []))
  }
  return [...seen]
}

const findBlockedDownstream = (nodes, edges) => {
  const blocked = nodes.filter((node) => node.status === 'blocked').flatMap((node) => affectedDownstream(node.id, edges))
  return [...new Set(blocked)]
}

const findOverdueNodes = (nodes, now) => nodes
  .filter((node) => node.status !== 'done' && node.deadline && new Date(node.deadline) < now)
  .map((node) => node.id)

const shouldEscalateBlock = (node, now) => {
  if (!node.blockedAt || node.resolvedAt) return false
  return now.getTime() - new Date(node.blockedAt).getTime() >= 3 * 24 * 60 * 60 * 1000
}

const buildSnapshot = (nodes, edges, now) => {
  const blocked = new Set(findBlockedDownstream(nodes, edges))
  return {
    edges,
    nodesState: nodes.map((node) => ({
      id: node.id,
      status: node.status,
      blocked: node.status === 'blocked' || blocked.has(node.id),
      overdue: findOverdueNodes([node], now).length > 0,
    })),
  }
}

module.exports = { affectedDownstream, buildSnapshot, findBlockedDownstream, findOverdueNodes, shouldEscalateBlock, topologicalSort }
