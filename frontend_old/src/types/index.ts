export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
  two_fa_enabled: boolean
}

export interface Company {
  id: number
  name: string
  slug: string
  company_type: 'main' | 'subsidiary'
  logo?: string
  color_primary: string
  parent?: Company
}

export interface Customer {
  id: number
  company_name: string
  contact_person: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface Project {
  id: number
  name: string
  description?: string
  status: string
  customer?: Customer
  budget?: number
}

export interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  assigned_to?: User
}
