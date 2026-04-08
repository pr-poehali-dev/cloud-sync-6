import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api, getUser, logout } from '@/lib/api'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'

interface User {
  user_id: number
  name: string
  referral_code: string
  balance: number
  total_earned: number
}

interface Tariff {
  id: number
  name: string
  slug: string
  price: number
}

interface Matrix {
  id: number
  tariff_name: string
  tariff_slug: string
  entry_price: number
  level: number
  status: string
  slots_filled: number
  created_at: string
}

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  description: string
  created_at: string
}

interface Referral {
  name: string
  joined: string
  matrices: number
}

type Tab = 'overview' | 'matrices' | 'referrals' | 'wallet'

const TYPE_LABELS: Record<string, string> = {
  topup: 'Пополнение',
  buy_tariff: 'Покупка тарифа',
  matrix_payout: 'Выплата матрицы',
  withdrawal: 'Вывод средств',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUser() as User | null

  const [tab, setTab] = useState<Tab>('overview')
  const [balance, setBalance] = useState(user?.balance || 0)
  const [totalEarned, setTotalEarned] = useState(user?.total_earned || 0)
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [matrices, setMatrices] = useState<Matrix[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(false)
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawBank, setWithdrawBank] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadData()
  }, [])

  async function loadData() {
    if (!user) return
    setLoading(true)
    try {
      const [balRes, tariffsRes, matricesRes] = await Promise.all([
        api.getBalance(user.user_id),
        api.getTariffs(),
        api.getMyMatrices(user.user_id),
      ])
      if (balRes.balance !== undefined) { setBalance(balRes.balance); setTotalEarned(balRes.total_earned) }
      if (tariffsRes.tariffs) setTariffs(tariffsRes.tariffs)
      if (matricesRes.matrices) setMatrices(matricesRes.matrices)
    } finally {
      setLoading(false)
    }
  }

  async function loadTransactions() {
    if (!user) return
    const res = await api.getTransactions(user.user_id)
    if (res.transactions) setTransactions(res.transactions)
  }

  async function loadReferrals() {
    if (!user) return
    const res = await api.getReferrals(user.user_id)
    if (res.referrals) setReferrals(res.referrals)
  }

  useEffect(() => {
    if (tab === 'wallet') loadTransactions()
    if (tab === 'referrals') loadReferrals()
  }, [tab])

  async function buyTariff(tariffId: number) {
    if (!user) return
    setBuyingId(tariffId)
    try {
      const res = await api.buyTariff(user.user_id, tariffId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Тариф активирован!')
      loadData()
    } finally {
      setBuyingId(null)
    }
  }

  async function handleTopup() {
    const amount = parseFloat(topupAmount)
    if (!amount || amount <= 0) { toast.error('Введи сумму'); return }
    toast.info('Интеграция с FreeKassa в разработке. Свяжись с администратором для пополнения.')
  }

  async function handleWithdraw() {
    if (!user) return
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) { toast.error('Введи сумму'); return }
    if (!withdrawPhone) { toast.error('Введи номер телефона СБП'); return }
    const res = await api.requestWithdrawal(user.user_id, amount, withdrawPhone, withdrawBank)
    if (res.error) { toast.error(res.error); return }
    toast.success('Заявка на вывод отправлена!')
    setWithdrawAmount('')
    setWithdrawPhone('')
    setWithdrawBank('')
    loadData()
    loadTransactions()
  }

  function copyRef() {
    const url = `${window.location.origin}/register?ref=${user?.referral_code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Ссылка скопирована!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  const refUrl = `${window.location.origin}/register?ref=${user.referral_code}`

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Обзор', icon: 'LayoutDashboard' },
    { key: 'matrices', label: 'Матрицы', icon: 'Grid3X3' },
    { key: 'referrals', label: 'Рефералы', icon: 'Users' },
    { key: 'wallet', label: 'Кошелёк', icon: 'Wallet' },
  ]

  return (
    <div className="min-h-screen bg-[#050a18] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050a18]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs font-bold">П</div>
            <span className="font-bold">Плям про<span className="text-blue-400">100</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm hidden md:block">{user.name}</span>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" onClick={() => { logout(); navigate('/') }}>
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-16 max-w-5xl mx-auto px-4 py-6">
        {/* Balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 col-span-2 md:col-span-1">
            <div className="text-white/50 text-sm mb-1">Баланс</div>
            <div className="text-2xl font-bold">{balance.toLocaleString('ru')} ₽</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-white/50 text-sm mb-1">Заработано всего</div>
            <div className="text-xl font-bold text-green-400">{totalEarned.toLocaleString('ru')} ₽</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-white/50 text-sm mb-1">Матриц активных</div>
            <div className="text-xl font-bold">{matrices.filter(m => m.status === 'active').length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
            >
              <Icon name={t.icon} size={14} />
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Реферальная ссылка</h3>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={refUrl}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/70 min-w-0"
                />
                <Button onClick={copyRef} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <Icon name={copied ? 'Check' : 'Copy'} size={16} />
                </Button>
              </div>
              <p className="text-white/40 text-xs mt-2">Код: <span className="text-white/70 font-mono">{user.referral_code}</span></p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Доступные тарифы</h3>
              {loading ? (
                <div className="text-white/50 text-center py-4">Загрузка...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {tariffs.map(t => {
                    const isActive = matrices.some(m => m.tariff_slug === t.slug && m.status === 'active')
                    const colors: Record<string, string> = { mini: 'from-blue-500 to-blue-700', minor: 'from-purple-500 to-purple-700', major: 'from-yellow-500 to-orange-600' }
                    return (
                      <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="font-semibold mb-1">{t.name}</div>
                        <div className="text-2xl font-bold mb-3">{t.price.toLocaleString('ru')} ₽</div>
                        {isActive ? (
                          <div className="text-green-400 text-sm flex items-center gap-1">
                            <Icon name="CheckCircle" size={14} /> Активен
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className={`w-full bg-gradient-to-r ${colors[t.slug] || 'from-blue-500 to-blue-700'} text-white hover:opacity-90`}
                            onClick={() => buyTariff(t.id)}
                            disabled={buyingId === t.id || balance < t.price}
                          >
                            {buyingId === t.id ? <Icon name="Loader2" size={14} className="animate-spin mr-1" /> : null}
                            {balance < t.price ? 'Пополни баланс' : 'Купить'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matrices */}
        {tab === 'matrices' && (
          <div className="space-y-4">
            {matrices.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Icon name="Grid3X3" size={40} className="text-white/20 mx-auto mb-3" />
                <div className="text-white/50">Нет активных матриц</div>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setTab('overview')}>Купить тариф</Button>
              </div>
            ) : (
              matrices.map(m => (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">Тариф «{m.tariff_name}»</div>
                      <div className="text-white/50 text-sm">Вход: {m.entry_price.toLocaleString('ru')} ₽</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                      {m.status === 'active' ? 'Активна' : 'Завершена'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-white/50">Уровень: <span className="text-white font-semibold">{m.level}</span></div>
                    <div className="text-sm text-white/50">Слотов заполнено: <span className="text-white font-semibold">{m.slots_filled}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Referrals */}
        {tab === 'referrals' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Твоя реферальная ссылка</h3>
              <div className="flex gap-2 mb-4">
                <input readOnly value={refUrl} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/70 min-w-0" />
                <Button onClick={copyRef} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <Icon name={copied ? 'Check' : 'Copy'} size={16} />
                </Button>
              </div>
              <p className="text-white/40 text-xs">Приглашай по этой ссылке и получай выплаты за каждого участника</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Мои рефералы ({referrals.length})</h3>
              {referrals.length === 0 ? (
                <div className="text-white/40 text-center py-6">Рефералов пока нет</div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold">{r.name[0].toUpperCase()}</div>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-white/40 text-xs">{new Date(r.joined).toLocaleDateString('ru')}</div>
                        </div>
                      </div>
                      <div className="text-sm text-white/60">{r.matrices} матриц</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet */}
        {tab === 'wallet' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Plus" size={16} className="text-green-400" /> Пополнить баланс
                </h3>
                <input
                  type="number"
                  placeholder="Сумма в рублях"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/30 mb-3"
                />
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleTopup}>
                  Пополнить через FreeKassa
                </Button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon name="ArrowUpRight" size={16} className="text-blue-400" /> Вывести средства (СБП)
                </h3>
                <div className="space-y-2 mb-3">
                  <input
                    type="number"
                    placeholder="Сумма"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="+7 999 999-99-99"
                    value={withdrawPhone}
                    onChange={e => setWithdrawPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Банк (Сбер, Тинькофф...)"
                    value={withdrawBank}
                    onChange={e => setWithdrawBank(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/30"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleWithdraw}>
                  Запросить вывод
                </Button>
                <p className="text-white/40 text-xs mt-2">Доступно: {balance.toLocaleString('ru')} ₽</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">История операций</h3>
              {transactions.length === 0 ? (
                <div className="text-white/40 text-center py-6">Операций пока нет</div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">{TYPE_LABELS[tx.type] || tx.type}</div>
                        <div className="text-white/40 text-xs">{new Date(tx.created_at).toLocaleString('ru')}</div>
                      </div>
                      <div className={`font-semibold ${tx.type === 'buy_tariff' || tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'buy_tariff' || tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toLocaleString('ru')} ₽
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
