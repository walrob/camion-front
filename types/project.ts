import type { QuoteStatus, ProductionOrderStatus, SubOrderStatus, Priority, PaymentRecordType } from './enums'

export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  isTemplateDark?: boolean
}

export interface UserProfile {
  name: string
  phone?: string
  birthDate?: string
}

export interface Client {
  id: string
  name: string
  businessName?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  notes?: string
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  imageUrl?: string
  isActive: boolean
}

export interface Fabric {
  id: string
  name: string
  description?: string
  composition?: string
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  basePrice?: number
  sizes: string[]
  configurations: string[]
  images: string[]
  isActive: boolean
  category?: Category
  fabric?: Fabric
}

export interface ProductionStage {
  id: string
  name: string
  description?: string
  order?: number
  isActive: boolean
}

export interface PriceListItem {
  productId: string
  product?: Product
  price: number
  notes?: string
}

export interface PriceList {
  id: string
  name: string
  description?: string
  isActive: boolean
  items: PriceListItem[]
}

export interface QuoteItem {
  id?: string
  productId?: string
  product?: Product
  description?: string
  size?: string
  configuration?: string
  quantity: number
  unitPrice: number
  subtotal?: number
  notes?: string
}

export interface Quote {
  id: string
  number: string
  status: QuoteStatus
  totalAmount: number
  validUntil?: string
  notes?: string
  sentAt?: string | null
  sentBy?: string | null
  createdAt: string
  client: Client
  priceList?: PriceList
  items: QuoteItem[]
}

export interface SubOrderStage {
  id: string
  stageName: string
  order: number
  completed: boolean
  completedAt?: string | null
  completedBy?: string | null
  notes?: string | null
}

export interface SubOrder {
  id: string
  productId?: string
  product?: Product
  description?: string
  size?: string
  configuration?: string
  quantity: number
  status: SubOrderStatus
  notes?: string
  stages: SubOrderStage[]
}

export interface PaymentRecord {
  id: string
  type: PaymentRecordType
  amount: number
  date: string
  notes?: string
  createdAt: string
}

export interface ProductionOrder {
  id: string
  number: string
  status: ProductionOrderStatus
  priority: Priority
  deliveryDate?: string
  totalAmount?: number
  notes?: string
  createdAt: string
  client: Client
  quote?: { id: string; number: string }
  subOrders: SubOrder[]
  payments: PaymentRecord[]
}

export interface DashboardData {
  quotes?: {
    total: number
    draft: number
    sent: number
    approved: number
    rejected: number
  }
  productionOrders?: {
    total: number
    pending: number
    inProgress: number
    completed: number
    byPriority?: { urgente: number; alta: number; normal: number; baja: number }
  }
  clients?: { total: number }
  subOrders?: { pending: number; inProgress: number; completed: number }
}
