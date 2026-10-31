import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CloudSun,
  Download,
  Hourglass,
  Moon,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Volume2,
  Droplets,
  Wind,
  Thermometer,
} from 'lucide-react'
import { useStudio } from '../store'
import { sound } from '../lib/sound'
import { getCurrentWeather } from '../lib/weather'
import { notificationPermission, notificationsSupported, requestNotificationPermission } from '../lib/notify'
import { pluralRu } from '../lib/format'
import type { Weather } from '../types'
import { Button, ConfirmDialog, Segmented, SettingRow, Slider, Switch, toast } from '../components/ui'
import { Reveal } from '../components/ui/Reveal'
import { getTheme, setTheme, type Theme } from '../components/shell/theme'

const APP_VERSION = '1.0.0'

function Section({ title, overline, children }: { title: ReactNode; overline: string; children: ReactNode }) {
  return (
    <Reveal as="section" className="grid gap-5 md:grid-cols-[220px_1fr] md:gap-10">
      <div className="md:pt-6">
        <p className="font-mono text-overline text-text-3 uppercase">{overline}</p>
        <h2 className="mt-2 font-display text-h1 font-medium text-text-1">{title}</h2>
      </div>
      <div className="card divide-y divide-border p-5 sm:p-6">{children}</div>
    </Reveal>
  )
}

function WeatherPreview({ weather, loading }: { weather: Weather | null; loading: boolean }) {
  if (loading)
    return (
      <div className="mt-4 h-[76px] animate-pulse rounded-md bg-surface-2" aria-label="Загружаем погоду" role="status" />
    )
  if (!weather) return null
  return (
    <div className="mt-4 flex items-center gap-5 rounded-md border border-border bg-surface-2 px-4 py-3.5">
      <div>
        <p className="font-display text-[2.25rem] leading-none text-text-1 tabular">
          {weather.temperature > 0 ? '+' : ''}
          {Math.round(weather.temperature)}°
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-text-1">{weather.label}</p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-caption text-text-2">
          <span className="inline-flex items-center gap-1"><CloudSun aria-hidden className="size-3.5" />{Math.round(weather.cloudCover)}%</span>
          <span className="inline-flex items-center gap-1"><Droplets aria-hidden className="size-3.5" />{weather.precipitation} мм</span>
          <span className="inline-flex items-center gap-1"><Wind aria-hidden className="size-3.5" />{Math.round(weather.windSpeed)} км/ч</span>
        </p>
      </div>
      <Thermometer aria-hidden className="hidden size-5 text-text-3 sm:block" />
    </div>
  )
}

export default function SettingsPage() {
  const settings = useStudio((s) => s.settings)
  const frames = useStudio((s) => s.frames.length)
  const update = useStudio((s) => s.updateSettings)
  const exportData = useStudio((s) => s.exportData)
  const importData = useStudio((s) => s.importData)
  const resetAll = useStudio((s) => s.resetAll)

  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [notifBusy, setNotifBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [name, setName] = useState(settings.name)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Настройки · Проявка'
  }, [])

  useEffect(() => setName(settings.name), [settings.name])

  const loadWeather = async () => {
    setWeatherLoading(true)
    const w = await getCurrentWeather()
    setWeatherLoading(false)
    setWeather(w)
    return w
  }

  // preview current weather if already enabled
  useEffect(() => {
    if (settings.weather) void loadWeather()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSound = (on: boolean) => {
    update({ sound: on })
    sound.setEnabled(on)
    if (on) {
      sound.unlock()
      sound.playCue('click')
    }
  }

  const onWeather = async (on: boolean) => {
    if (!on) {
      update({ weather: false })
      setWeather(null)
      return
    }
    update({ weather: true })
    const w = await loadWeather()
    if (!w) {
      update({ weather: false })
      toast('Не получилось узнать погоду', {
        tone: 'warning',
        description: 'Разрешите доступ к геолокации в браузере или попробуйте позже.',
      })
    } else {
      toast(`За окном: ${w.label.toLowerCase()}, ${Math.round(w.temperature)}°`, { tone: 'success' })
    }
  }

  const onNotifications = async (on: boolean) => {
    if (!on) return update({ notifications: false })
    if (!notificationsSupported()) {
      toast('Этот браузер не умеет показывать уведомления', { tone: 'warning' })
      return
    }
    setNotifBusy(true)
    const ok = await requestNotificationPermission()
    setNotifBusy(false)
    update({ notifications: ok })
    if (ok) toast('Позовём, когда кадр проявится', { tone: 'success' })
    else
      toast('Уведомления запрещены', {
        tone: 'warning',
        description: 'Их можно разрешить в настройках сайта в браузере.',
      })
  }

  const onTheme = (t: Theme) => {
    setThemeState(t)
    setTheme(t)
  }

  const commitName = () => {
    const v = name.trim().slice(0, 80)
    if (v !== settings.name) {
      update({ name: v })
      toast(v ? `Кадры будут подписаны: ${v}` : 'Подпись убрана')
    }
  }

  const onExport = () => {
    try {
      const blob = new Blob([exportData()], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const d = new Date()
      a.href = url
      a.download = `proyavka-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast('Архив сохранён', { tone: 'success', description: `${frames} ${pluralRu(frames, ['кадр', 'кадра', 'кадров'])} и настройки` })
    } catch {
      toast('Не удалось сохранить файл', { tone: 'danger' })
    }
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      if (importData(text)) {
        const n = useStudio.getState().frames.length
        toast('Архив загружен', { tone: 'success', description: `В альбоме ${n} ${pluralRu(n, ['кадр', 'кадра', 'кадров'])}` })
      } else toast('Это не похоже на архив Проявки', { tone: 'danger' })
    } catch {
      toast('Не удалось прочитать файл', { tone: 'danger' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const perm = notificationPermission()

  return (
    <div className="mx-auto max-w-[960px] pt-6 pb-10 md:pt-10">
      <header className="mb-12 md:mb-16">
        <p className="font-mono text-overline text-text-3 uppercase">Настройки</p>
        <h1 className="mt-3 font-display text-display-lg font-medium text-text-1">
          Как устроена <em className="font-normal text-accent-soft">ваша</em> тёмная комната
        </h1>
      </header>

      <div className="space-y-10 md:space-y-14">
        <Section overline="01" title="Подпись">
          <SettingRow
            icon={<UserRound className="size-5" />}
            title="Имя"
            hint="Появится в подписи под кадром при экспорте."
            htmlFor="settings-name"
          >
            <input
              id="settings-name"
              value={name}
              maxLength={80}
              autoComplete="given-name"
              placeholder="Например, Аня"
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="mt-4 h-11 w-full rounded-sm border border-border-strong bg-surface-2 px-3.5 text-body text-text-1 placeholder:text-text-3 focus:border-focus focus:shadow-[0_0_0_4px_color-mix(in_oklch,var(--focus)_20%,transparent)] focus:outline-none"
            />
          </SettingRow>
        </Section>

        <Section overline="02" title="Тёмная комната">
          <SettingRow
            icon={<Volume2 className="size-5" />}
            title="Звук тёмной комнаты"
            hint="Тихий гул лампы, капли и плеск в ванночке. Без файлов — всё синтезируется на лету."
            control={<Switch checked={settings.sound} onChange={onSound} aria-label="Звук тёмной комнаты" />}
          />
          <SettingRow
            icon={<Bell className="size-5" />}
            title="Уведомление о готовом кадре"
            hint={
              perm === 'denied'
                ? 'Уведомления запрещены в браузере — разрешите их в настройках сайта.'
                : 'Браузер позовёт, когда кадр проявится, даже если вкладка свёрнута.'
            }
            control={
              <Switch
                checked={settings.notifications && perm === 'granted'}
                busy={notifBusy}
                disabled={notifBusy || perm === 'unsupported'}
                onChange={onNotifications}
                aria-label="Уведомление о готовом кадре"
              />
            }
          />
          <SettingRow
            icon={<Hourglass className="size-5" />}
            title="Время на возврат"
            hint="Сколько секунд дверь остаётся открытой, прежде чем свет начнёт засвечивать бумагу."
            control={
              <span className="font-mono text-mono-sm text-text-1 tabular">
                {settings.graceSeconds}&nbsp;с
              </span>
            }
          >
            <Slider
              className="mt-3"
              aria-label="Время на возврат, секунды"
              min={3}
              max={30}
              step={1}
              value={settings.graceSeconds}
              onChange={(v) => update({ graceSeconds: v })}
              format={(v) => `${v} ${pluralRu(v, ['секунда', 'секунды', 'секунд'])}`}
            />
            <div className="flex justify-between font-mono text-caption text-text-3">
              <span>3 с · строго</span>
              <span>30 с · мягко</span>
            </div>
          </SettingRow>
        </Section>

        <Section overline="03" title="Погода">
          <SettingRow
            icon={<CloudSun className="size-5" />}
            title="Погода за окном"
            hint="Дождь добавит капель и зерна, облака — мягкости, мороз — холодного тона. Нужна геолокация; координаты уходят только в Open-Meteo."
            control={<Switch checked={settings.weather} busy={weatherLoading} disabled={weatherLoading} onChange={onWeather} aria-label="Погода за окном" />}
          >
            {settings.weather && <WeatherPreview weather={weather} loading={weatherLoading} />}
          </SettingRow>
        </Section>

        <Section overline="04" title="Внешний вид">
          <SettingRow
            icon={theme === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            title="Тема"
            hint="Ночь — для тёмной комнаты, Бумага — для дневного света."
          >
            <Segmented<Theme>
              className="mt-4"
              block
              aria-label="Тема оформления"
              value={theme}
              onChange={onTheme}
              options={[
                { value: 'dark', label: 'Ночь', icon: <Moon aria-hidden className="size-4" /> },
                { value: 'light', label: 'Бумага', icon: <Sun aria-hidden className="size-4" /> },
              ]}
            />
          </SettingRow>
        </Section>

        <Section overline="05" title="Данные">
          <SettingRow
            icon={<Download className="size-5" />}
            title="Сохранить архив"
            hint={`Все кадры (${frames}) и настройки одним JSON-файлом.`}
            control={
              <Button variant="ghost" size="sm" onClick={onExport}>
                Скачать
              </Button>
            }
          />
          <SettingRow
            icon={<Upload className="size-5" />}
            title="Загрузить архив"
            hint="Заменит текущий альбом кадрами из файла."
            control={
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                Выбрать файл
              </Button>
            }
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
          </SettingRow>
          <SettingRow
            icon={<Trash2 className="size-5 text-danger" />}
            title="Стереть всё"
            hint="Альбом, статистика и настройки удалятся с этого устройства. Отменить нельзя."
            control={
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} className="!border-danger/40 !text-danger hover:!bg-danger/10">
                Стереть
              </Button>
            }
          />
        </Section>

        <Section overline="06" title="О Проявке">
          <div className="space-y-4 text-body text-text-2">
            <p>
              <span className="text-text-1">Проявка</span> — тёмная комната для времени без экрана. Кадры рисует генератор, а не нейросеть;
              всё, что вы здесь делаете, хранится только в этом браузере. Нет аккаунтов, серверов и трекеров.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-caption text-text-3 uppercase">
              <span>Версия {APP_VERSION}</span>
              <span>Без AI · Без аккаунта</span>
              <Link to="/" className="text-text-2 underline-offset-4 hover:text-text-1 hover:underline">
                О проекте
              </Link>
            </div>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        title="Стереть всё?"
        description={`${frames} ${pluralRu(frames, ['кадр', 'кадра', 'кадров'])}, статистика и настройки исчезнут с этого устройства. Если нужна копия — сначала скачайте архив.`}
        confirmLabel="Стереть навсегда"
        cancelLabel="Оставить"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          setConfirmReset(false)
          toast('Тёмная комната пуста. Можно начинать заново.')
        }}
      />
    </div>
  )
}
