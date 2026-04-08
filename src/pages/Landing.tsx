import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'mini' | 'minor' | 'major'>('mini')

  const tariffs = [
    {
      key: 'mini',
      name: 'Мини',
      price: 300,
      color: 'from-blue-500 to-blue-700',
      border: 'border-blue-500',
      levels: [
        { level: 1, payout: 300, slots: 2 },
        { level: 2, payout: 600, slots: 2 },
        { level: 3, payout: 1200, slots: 4 },
        { level: 4, payout: 2400, slots: 4 },
        { level: 5, payout: 4800, slots: 4 },
      ],
      total: 14700,
    },
    {
      key: 'minor',
      name: 'Минор',
      price: 6000,
      color: 'from-purple-500 to-purple-700',
      border: 'border-purple-500',
      levels: [
        { level: 1, payout: 6000, slots: 2 },
        { level: 2, payout: 12000, slots: 2 },
        { level: 3, payout: 24000, slots: 4 },
        { level: 4, payout: 48000, slots: 4 },
        { level: 5, payout: 96000, slots: 4 },
      ],
      total: 294000,
    },
    {
      key: 'major',
      name: 'Мажор',
      price: 120000,
      color: 'from-yellow-500 to-orange-600',
      border: 'border-yellow-500',
      levels: [
        { level: 1, payout: 120000, slots: 2 },
        { level: 2, payout: 240000, slots: 2 },
        { level: 3, payout: 480000, slots: 4 },
        { level: 4, payout: 960000, slots: 4 },
        { level: 5, payout: 1920000, slots: 4 },
      ],
      total: 5880000,
    },
  ]

  const activeTariff = tariffs.find(t => t.key === activeTab)!

  return (
    <div className="min-h-screen bg-[#050a18] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050a18]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs font-bold">П</div>
            <span className="font-bold text-lg">Плям про<span className="text-blue-400">100</span></span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-white/80 hover:text-white" onClick={() => navigate('/login')}>
              Войти
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/register')}>
              Начать
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a2a6c33_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <Icon name="Rocket" size={14} />
            Матричная система заработка
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Плям про<span className="text-blue-400">100</span>
          </h1>
          <p className="text-xl text-white/60 mb-4">
            Зарабатывай приглашая друзей. Три тарифа — три уровня дохода.
          </p>
          <p className="text-white/40 mb-10">
            Вход от <span className="text-white font-semibold">300 ₽</span> · Заработок до <span className="text-yellow-400 font-semibold">5 880 000 ₽</span>
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={() => navigate('/register')}>
              Зарегистрироваться
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => document.getElementById('tariffs')?.scrollIntoView({ behavior: 'smooth' })}>
              Подробнее
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Тарифов', value: '3' },
            { label: 'Уровней матрицы', value: '5' },
            { label: 'Макс. заработок', value: '5.8 млн ₽' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-white/50 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'UserPlus', title: 'Регистрируйся', desc: 'Создай аккаунт и выбери тариф. Вход от 300 ₽.' },
              { icon: 'Share2', title: 'Приглашай', desc: 'Делись своей реферальной ссылкой с друзьями и знакомыми.' },
              { icon: 'TrendingUp', title: 'Зарабатывай', desc: 'Получай выплаты на баланс за каждого участника в матрице.' },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name={s.icon} size={24} className="text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tariffs */}
      <section id="tariffs" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Тарифы</h2>
          <p className="text-white/50 text-center mb-10">Выбери подходящий уровень участия</p>

          <div className="flex justify-center gap-2 mb-8">
            {tariffs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as 'mini' | 'minor' | 'major')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === t.key ? `bg-gradient-to-r ${t.color} text-white` : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className={`bg-white/5 border ${activeTariff.border} rounded-2xl p-8`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-bold">Тариф «{activeTariff.name}»</div>
                <div className="text-white/50">Вход: {activeTariff.price.toLocaleString('ru')} ₽</div>
              </div>
              <div className="text-right">
                <div className="text-white/50 text-sm">Итоговый заработок</div>
                <div className="text-2xl font-bold text-green-400">{activeTariff.total.toLocaleString('ru')} ₽</div>
              </div>
            </div>

            <div className="space-y-3">
              {activeTariff.levels.map(l => (
                <div key={l.level} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{l.level}</div>
                    <span className="text-white/70">Матрица {l.level}</span>
                    <span className="text-white/40 text-sm">{l.slots} слота</span>
                  </div>
                  <div className="font-semibold text-green-400">+{(l.payout * l.slots).toLocaleString('ru')} ₽</div>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className={`w-full mt-6 bg-gradient-to-r ${activeTariff.color} hover:opacity-90 text-white`}
              onClick={() => navigate('/register')}
            >
              Начать с тарифа «{activeTariff.name}»
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 text-center text-white/30 text-sm">
        © 2026 Плям про100 · Матричная система заработка
      </footer>
    </div>
  )
}