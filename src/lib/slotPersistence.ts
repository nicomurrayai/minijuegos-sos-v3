import type { SlotLeadPayload } from '../shared/slotConfig'

type CreateLeadArgs = {
  email: string
  isWinner: boolean
  prize: string | null
}

type CreateLeadMutation = (lead: CreateLeadArgs) => Promise<unknown>

const QUEUE_KEY = 'sos.slot.pending-leads.v1'

function readQueuedLeads(): SlotLeadPayload[] {
  try {
    const storedValue = window.localStorage.getItem(QUEUE_KEY)
    return storedValue ? (JSON.parse(storedValue) as SlotLeadPayload[]) : []
  } catch {
    return []
  }
}

function writeQueuedLeads(leads: SlotLeadPayload[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(leads))
}

export function queueSlotLead(lead: SlotLeadPayload) {
  writeQueuedLeads([...readQueuedLeads(), lead])
}

export async function persistSlotLead(
  createLead: CreateLeadMutation,
  lead: SlotLeadPayload,
) {
  try {
    await createLead({
      email: lead.email,
      isWinner: lead.isWinner,
      prize: lead.prize,
    })
    return 'saved' as const
  } catch {
    queueSlotLead(lead)
    return 'queued' as const
  }
}

export async function flushQueuedSlotLeads(createLead: CreateLeadMutation) {
  const queuedLeads = readQueuedLeads()

  if (!queuedLeads.length) {
    return 0
  }

  const remainingLeads: SlotLeadPayload[] = []
  let syncedCount = 0

  for (const lead of queuedLeads) {
    try {
      await createLead({
        email: lead.email,
        isWinner: lead.isWinner,
        prize: lead.prize,
      })
      syncedCount += 1
    } catch {
      remainingLeads.push(lead)
    }
  }

  writeQueuedLeads(remainingLeads)
  return syncedCount
}
