export type Client = {
  id: string
  name: string
  contactName: string
  contactPhone: string
  contactWechat: string
  company: string
  industry: string
  source: string
  level: 'S' | 'A' | 'B' | 'C'
  notes: string
  updated: string
}

export type ClientInput = Omit<Client, 'id' | 'updated'>
