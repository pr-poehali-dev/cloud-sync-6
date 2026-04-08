import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, saveUser } from '@/lib/api'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [ref, setRef] = useState(refCode)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !password.trim()) {
      toast.error('Заполни все поля')
      return
    }
    setLoading(true)
    try {
      let res
      if (mode === 'register') {
        res = await api.register(name.trim(), password.trim(), ref.trim() || undefined)
        if (res.error) { toast.error(res.error); return }
        toast.success('Аккаунт создан!')
      } else {
        res = await api.login(name.trim(), password.trim())
        if (res.error) { toast.error(res.error); return }
      }
      saveUser(res)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center font-bold">П</div>
            <span className="font-bold text-xl">Плям про<span className="text-blue-400">100</span></span>
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Вход в кабинет' : 'Регистрация'}</h1>
          <p className="text-white/50 mt-1">{mode === 'login' ? 'Введи имя и пароль' : 'Создай аккаунт и начни зарабатывать'}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 mb-1.5 block">Имя пользователя</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введи имя"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-white/70 mb-1.5 block">Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введи пароль"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            {mode === 'register' && (
              <div>
                <Label className="text-white/70 mb-1.5 block">Реферальный код (необязательно)</Label>
                <Input
                  value={ref}
                  onChange={e => setRef(e.target.value)}
                  placeholder="Код пригласившего"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2" disabled={loading}>
              {loading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="mt-6 text-center text-white/50 text-sm">
            {mode === 'login' ? (
              <>Нет аккаунта? <Link to="/register" className="text-blue-400 hover:underline">Зарегистрироваться</Link></>
            ) : (
              <>Уже есть аккаунт? <Link to="/login" className="text-blue-400 hover:underline">Войти</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
