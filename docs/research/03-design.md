# 03 — Дизайн-система: арт-дирекшн, токены, моушн, компоненты

> Контекст: премиальное потребительское веб-приложение (React + Vite + Tailwind v4, только клиент). Личное, эмоциональное, построенное на визуализации данных: жизнь, время, деньги, внимание. Цель: «вау» за первые 10 секунд.
> Дата исследования: 31.10.2026. Код на английском, текст на русском.

---

## 0. Что показало исследование (коротко)

| Направление | Что происходит в 2025–2026 | Вывод для нас |
|---|---|---|
| Awwwards / SOTY | Сайт года 2025 (Lando Norris) сделан на WebGL + GSAP. Эпоха «glow» уходит в сторону **шейдеров**, крупной **кинетической типографики** и **скролл-сторителлинга** | Один сильный «живой» визуальный объект (canvas/WebGL) на первом экране вместо десятка эффектов |
| Linear (рефреш UI 12.03.2026) | «Спокойнее и последовательнее»: приглушённый хром и сайдбар, ставка на сканируемость и фокус. Темы считаются в **LCH** (из базового цвета, акцента и уровня контраста получается около 98 токенов) | Хром интерфейса тихий, данные громкие. Нейтрали выводим перцептивно (OKLCH), а не через HSL |
| Raycast / Arc / Things | Мгновенный отклик, ease-out 150–250 мс, пружины для жестов. У Raycast у частых действий вообще нет анимации открытия | Анимации короткие на частых действиях и выразительные только на редких «моментах» |
| Bento grid | Остаётся мейнстримом на лендингах и дашбордах | Используем как сетку для стат-тайлов, но с одним «героем» на экран, а не равномерной мозаикой |
| Glass / Liquid Glass (Apple) | Растёт благодаря Apple. Ломается на длинном тексте и при низком контрасте | Стекло только для плавающего хрома (навбар, тултип, шит), не для карточек с текстом |
| Нео-брутализм | Как стиль страницы остывает, как акцент (CTA, бейджи) работает | Не берём как основу; держим в альтернативе C |
| Тёплый минимализм + зерно | Растёт «тёплый, тактильный, эмоциональный» минимализм с шумом и зерном | Зерно и тёплые нейтрали входят в рекомендацию |
| Data art (Lupi, Bremer) | Data Humanism у Lupi: «принять сложность, выйти за рамки стандартов, вплести контекст, данные несовершенны». У Bremer: SVG-градиенты, зависящие от данных, glow-фильтры, «gooey» | Визуализация как портрет человека: каждая точка = момент жизни, свечение = значимость, аннотации от руки |

---

## 1. Арт-дирекшн: три альтернативы

### A. «Ноктюрн» (Nocturne) — **РЕКОМЕНДУЕТСЯ**
**Настроение:** ночная обсерватория. Тёмный чернильно-синий холст, а на нём ваша жизнь горит как созвездие. Тихо, интимно, немного торжественно. Тёплые «свечные» акценты против холодной ночи.
- Фон: глубокий ink `#0B0D14`, мягкий радиальный «зенит» и плёночное зерно.
- Данные светятся (glow в духе Bremer) и мерцают при наведении. Всё остальное приглушено.
- Типографика редакционная: крупный антиквенный дисплей с курсивом для эмоциональных фраз («Вы прожили **12 418** рассветов»), спокойный гротеск для UI, моно для чисел.
- Стекло только у плавающих элементов.
- **Почему он:** тёмный холст максимизирует яркость и насыщенность данных (палитра даёт 7–11:1 на фоне), выигрышно смотрится в скриншотах и шеринге, совпадает с трендами «шейдеры + тёмный режим + зерно» и даёт эмоциональный тон без китча.

### B. «Бумага и чернила» (Paper & Ink)
**Настроение:** личный дневник и редакционный журнал (Dear Data, Readymag). Тёплая кремовая бумага, чернильные линии, акварельные пятна данных, рукописные аннотации.
- Фон `#F6F3EE`, текст `#16171D`, акценты терракота, охра, шалфей.
- Плюсы: очень человечно, отлично для «жизни в неделях» и рефлексии.
- Минусы: «вау» тише, пастельные данные хуже читаются, сложнее эффект свечения.
- **Используется как светлая тема рекомендованного направления.**

### C. «Сигнал» (Signal)
**Настроение:** нео-брутализм, сведённый с Raycast. Чёрный фон, кислотный лайм `#D4FF3A`, жёсткие 1px-рамки, моно-типографика, плотные сетки, «терминальная» честность цифр.
- Плюсы: смело, запоминается, дёшево в реализации.
- Минусы: холодно и «технарски», конфликтует с эмоциональным и личным позиционированием, быстро устаревает.
- Годится для внутренних экранов (например, «режим аналитики») или для промо.

---

## 2. Цвет (Nocturne)

Все пары проверены по WCAG 2.x (коэффициенты указаны в скобках).

### 2.1 Тёмная тема (основная)

| Токен | Hex | Применение / контраст |
|---|---|---|
| `--bg` | `#0B0D14` | Фон приложения |
| `--bg-zenith` | `#151A2E` | Центр радиального градиента фона (верх экрана) |
| `--surface-1` | `#12151F` | Карточки |
| `--surface-2` | `#1A1E2B` | Вложенные / hover / инпуты |
| `--surface-3` | `#232838` | Поповеры, активные элементы |
| `--border` | `rgba(237,234,227,0.08)` | Разделители, рамки карточек |
| `--border-strong` | `rgba(237,234,227,0.16)` | Рамки инпутов, фокус-контуры второго уровня |
| `--text-1` | `#EDEAE3` | Основной текст, тёплый белый (16.2:1 на bg) |
| `--text-2` | `#A9ABB8` | Вторичный (8.5:1) |
| `--text-3` | `#7E8296` | Мета, подписи осей (≈5.1:1 на bg, ≥4.5 на surface-1). На surface-2 только для текста ≥14px medium |
| `--accent` | `#FF8A5B` | Ember: бренд-акцент, primary CTA (8.4:1 на bg) |
| `--accent-soft` | `#FFB38A` | Hover акцента, свечение |
| `--on-accent` | `#0B0D14` | Текст на акцентной кнопке (8.4:1) |
| `--focus` | `#6AA8FF` | Кольцо фокуса |

### 2.2 Светлая тема («Бумага»)

| Токен | Hex | Применение / контраст |
|---|---|---|
| `--bg` | `#F6F3EE` | Тёплая бумага |
| `--bg-zenith` | `#FFFFFF` | Центр радиального градиента |
| `--surface-1` | `#FFFFFF` | Карточки |
| `--surface-2` | `#EEEAE3` | Инпуты / hover |
| `--surface-3` | `#E4DFD6` | Активные |
| `--border` | `rgba(22,23,29,0.08)` | |
| `--border-strong` | `rgba(22,23,29,0.16)` | |
| `--text-1` | `#16171D` | (16.2:1) |
| `--text-2` | `#55586A` | (6.4:1) |
| `--text-3` | `#6B6E7D` | (4.6:1 на bg, 5.1:1 на surface-1; на surface-2 только ≥14px medium) |
| `--accent` | `#C2451C` | Терракота (5.05:1 с белым текстом) |
| `--accent-soft` | `#D2552A` | hover |
| `--on-accent` | `#FFFFFF` | |
| `--focus` | `#2F6BDB` | |

### 2.3 Палитра данных (5 категорий)
Порядок фиксирован: первая серия всегда Ember. В тёмной теме все цвета ≥6.7:1 к фону, в светлой ≥3.6:1 к фону (это норма WCAG 1.4.11 для графики, ≥3:1).

| # | Имя | Смысл (рекомендация) | Dark | Light |
|---|---|---|---|---|
| 1 | Ember | время / «вы» | `#FF8A5B` | `#D2552A` |
| 2 | Amber | деньги | `#F2C14E` | `#A87508` |
| 3 | Aurora | здоровье / энергия | `#5ED6B0` | `#13896A` |
| 4 | Glacier | внимание / работа | `#6AA8FF` | `#2F6BDB` |
| 5 | Orchid | люди / отношения | `#C38BFF` | `#8A4FD6` |

**Последовательная шкала** (heatmap, «жизнь в неделях»): от `--surface-2` к `--accent` через `color-mix(in oklch, var(--accent) N%, var(--surface-2))` с шагами 12/28/48/72/100%.
**Расходящаяся шкала** (плюс/минус, доход/расход): Glacier, нейтраль `--surface-3`, Ember.
**Правило:** цвет никогда не единственный носитель смысла: дублируем формой (круг / ромб / штрих), подписью или паттерном.

### 2.4 Семантические цвета

| Токен | Dark | Light |
|---|---|---|
| `--success` | `#4FD18B` | `#1E8A50` |
| `--warning` | `#F2C14E` | `#A87508` |
| `--danger` | `#FF6B6B` | `#D23B3B` |
| `--info` | `#6AA8FF` | `#2F6BDB` |

Фон бейджа или тоста: тот же цвет с 12% прозрачности (`color-mix(in oklch, var(--danger) 12%, transparent)`), текст полным цветом.

---

## 3. Типографика

### 3.1 Пара шрифтов (Google Fonts, все с кириллицей)

| Роль | Шрифт | Начертания | Почему |
|---|---|---|---|
| Display | **Cormorant Garamond** | 500, 600, 500 italic | Высококонтрастная антиква с роскошным курсивом: редакционный, эмоциональный тон. Хорошо держит кириллицу на 40px+ |
| Text / UI | **Onest** | variable 400–700 | Современный гротеск, спроектированный под кириллицу, нейтральнее и «теплее» Inter |
| Mono / цифры | **JetBrains Mono** | 400, 500 | Табличные цифры, счётчики, оси, тайм-коды |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Onest:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap&subset=cyrillic,latin" rel="stylesheet">
```
*Если продукт только англоязычный, есть альтернатива: Instrument Serif + Geist + Geist Mono (у Instrument Serif нет кириллицы).*
Для больших чисел внутри текста: `font-variant-numeric: tabular-nums lining-nums` в Onest. Моно используется только там, где нужен «приборный» характер.

### 3.2 Шкала (база 16px, примерно Major Third 1.25, display растягивается через clamp)

| Токен | Размер | rem | line-height | letter-spacing | Шрифт / вес |
|---|---|---|---|---|---|
| `display-2xl` | clamp(56→120px) | 3.5→7.5 | 0.95 | -0.03em | Cormorant 500 (курсив для акцентных слов) |
| `display-xl` | clamp(44→80px) | 2.75→5 | 1.0 | -0.025em | Cormorant 500 |
| `display-lg` | clamp(36→56px) | 2.25→3.5 | 1.05 | -0.02em | Cormorant 500 |
| `h1` | 32px | 2 | 1.15 | -0.015em | Onest 600 |
| `h2` | 24px | 1.5 | 1.2 | -0.01em | Onest 600 |
| `h3` | 20px | 1.25 | 1.3 | -0.005em | Onest 600 |
| `body-lg` | 18px | 1.125 | 1.55 | 0 | Onest 400 |
| `body` | 16px | 1 | 1.55 | 0 | Onest 400 |
| `body-sm` | 14px | 0.875 | 1.5 | 0.005em | Onest 400/500 |
| `caption` | 12px | 0.75 | 1.4 | 0.02em | Onest 500 |
| `overline` | 11px | 0.6875 | 1.3 | 0.12em, UPPERCASE | Onest 600 |
| `stat-xl` | clamp(40→72px) | 2.5→4.5 | 1.0 | -0.02em | Onest 600 tabular (или Cormorant для «эмоциональных» чисел) |
| `mono-sm` | 13px | 0.8125 | 1.4 | 0 | JetBrains Mono 400 |

Правила: ширина строки 60–72ch; на тёмном фоне вес body не ниже 400 (тонкие начертания «рассыпаются»); дисплейный курсив только на 1–3 словах в заголовке.

---

## 4. Пространство, радиусы, тени, блюр, зерно

### 4.1 Отступы (шаг 4px)
`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` px. В Tailwind v4 это `--spacing: 0.25rem`, поэтому `p-4` = 16px.
- Внутренний отступ карточки: 20px (mobile) / 24px (desktop); у hero-карточек 32px.
- Gap бенто-сетки: 12px (mobile) / 16px (desktop).
- Вертикальный ритм секций: 64 / 96 / 128px.
- Max-width контента: 1200px; текстовой колонки 680px.

### 4.2 Радиусы
| Токен | px | Где |
|---|---|---|
| `--radius-xs` | 6 | бейджи, чекбоксы |
| `--radius-sm` | 10 | инпуты, кнопки sm, тултип |
| `--radius-md` | 14 | кнопки, сегменты |
| `--radius-lg` | 20 | карточки |
| `--radius-xl` | 28 | модалки, шиты, hero |
| `--radius-full` | 9999 | пилюли, аватары, ползунок слайдера |
Правило вложенности: inner = outer − padding (карточка 20, отступ 8, значит вложенный элемент 12).

### 4.3 Тени (тёмная тема: тень плюс верхний блик, а не просто тень)
```
--shadow-sm:  0 1px 2px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
--shadow-md:  0 8px 24px -6px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05);
--shadow-lg:  0 24px 64px -12px rgba(0,0,0,.6), 0 8px 20px -8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06);
--shadow-glow: 0 0 0 1px color-mix(in oklch, var(--accent) 40%, transparent), 0 8px 32px -4px color-mix(in oklch, var(--accent) 45%, transparent);
```
Светлая тема: те же уровни, но `rgba(22,23,29,.06–.12)` и без inset-блика.

### 4.4 Блюр / стекло
| Токен | Значение | Где |
|---|---|---|
| `--blur-sm` | 8px | тултипы |
| `--blur-md` | 16px | навбар, таб-бар |
| `--blur-lg` | 32px | шит, модальный оверлей |
Стекло = `background: color-mix(in oklch, var(--surface-1) 72%, transparent); backdrop-filter: blur(var(--blur-md)) saturate(140%); border: 1px solid var(--border);`.
Фолбэк `@supports not (backdrop-filter: blur(1px))` даёт непрозрачный `--surface-1`.

### 4.5 Зерно и шум (только CSS/SVG)
- Глобальный слой: `body::after` с `position: fixed; inset: 0; pointer-events: none; z-index: 100`, inline-SVG `feTurbulence` (`baseFrequency=.8`, `numOctaves=3`, `stitchTiles=stitch`) в data-URI, тайл 160px, `opacity: .06` (dark) / `.04` (light), `mix-blend-mode: overlay` (dark) / `multiply` (light).
- Фон: `radial-gradient(120% 80% at 50% -10%, var(--bg-zenith), var(--bg) 60%)` плюс 1–2 размытых цветных «туманности» (`filter: blur(80px)`, `opacity .18`, цвета Glacier / Orchid), которые очень медленно дрейфуют (60 с, `alternate`).
- Зерно статично (без анимации): дешевле по производительности и не раздражает. При `prefers-reduced-transparency` / `forced-colors` убираем.
- Зерно снимает «бандинг» градиентов на 8-битных экранах, это не только эстетика.

---

## 5. Моушн

### 5.1 Принципы
1. **Данные двигаются, хром нет.** Хром реагирует мгновенно (≤150 мс), выразительное движение достаётся только визуализациям и «моментам».
2. **Физика, а не таймлайн.** Жесты и перетаскивание на пружинах, прерываемые.
3. **Одно хореографическое событие на экран.** Stagger до 8 элементов, дальше группируем.
4. **Вход дольше выхода** (выход ≈ 70% от входа).
5. **Уважаем `prefers-reduced-motion`:** заменяем движение на fade ≤120 мс, отключаем параллакс, дрейф и счётчики (сразу показываем финальное число).

### 5.2 Длительности
| Токен | мс | Где |
|---|---|---|
| `--dur-instant` | 90 | hover цвета, press |
| `--dur-fast` | 160 | тултипы, кнопки, переключатели |
| `--dur-base` | 240 | дропдауны, тосты, карточки |
| `--dur-slow` | 400 | модалки, шиты, переходы страниц |
| `--dur-story` | 800 | появление визуализации |
| `--dur-epic` | 1600 | интро-«вау» (один раз за сессию) |

### 5.3 Кривые
| Токен | cubic-bezier | Где |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | по умолчанию для входа (easeOutQuint) |
| `--ease-in` | `cubic-bezier(0.55, 0, 1, 0.45)` | выход / уход за экран |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | перемещения, морфинг |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | шиты, переходы страниц |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | лёгкий overshoot (бейджи, «поп» точки) |
| `--ease-linear-data` | `linear` | анимация прогресса времени |
Пружины (Motion / `motion/react`): **UI:** `{ type: "spring", duration: 0.45, bounce: 0.15 }`; **жесты/шит:** `{ stiffness: 420, damping: 40, mass: 1 }`; **данные:** `{ stiffness: 120, damping: 20 }`.

### 5.4 Фирменные микро-взаимодействия
1. **«Зажигание» (Ignition)**, интро: сначала пустой ink-экран, потом точки-«звёзды» (по одной на неделю/месяц жизни) зажигаются волной от центра (stagger по расстоянию, 1.6 с суммарно), затем выплывает заголовок display-2xl. Это и есть «вау» за 10 секунд. Повтор не чаще 1 раза в сессию, при reduced motion сразу финальный кадр.
2. **Тикающий счётчик:** числа считаются от 0 до значения за 800 мс (`ease-out`), цифры моно/табличные, чтобы ширина не прыгала. Живые счётчики («секунд прожито») обновляются раз в секунду с vertical-roll последней цифры (160 мс).
3. **Свечение под курсором:** у карточек радиальный highlight, следующий за курсором (`--mx/--my`, `radial-gradient(400px at var(--mx) var(--my), rgba(255,255,255,.06), transparent)`). На тач-устройствах отключено.
4. **Магнит точки данных:** при наведении ближайшая точка увеличивается (scale 1→1.6, `--ease-spring`), получает glow (`drop-shadow 0 0 8px`), соседние гаснут до 35% opacity.
5. **Пружинный слайдер:** ползунок при захвате растёт (scale 1.15), трек подсвечивается акцентом, визуализация перестраивается в реальном времени. Отпускание сопровождается мягким overshoot.
6. **Нажатие:** `scale(0.97)` за 90 мс у всех кликабельных элементов.

### 5.5 Переходы страниц
- View Transitions API (`document.startViewTransition`, через React Router `viewTransition`) с фолбэком на Motion `AnimatePresence`.
- По умолчанию: старая страница уходит (opacity 1→0, `translateY 0→-8px`, 160 мс, ease-in), новая приходит (opacity 0→1, `translateY 12px→0`, blur 6→0px, 400 мс, ease-emphasized).
- **Shared element:** стат-тайл раскрывается в детальную страницу (`view-transition-name: stat-{id}`), это главный переход для drill-down.

---

## 6. Компоненты (визуальные спецификации)

### 6.1 App shell и навигация
- **Desktop (≥1024):** плавающий стеклянный топ-бар, высота 56px, отступ 12px от краёв, радиус `xl`, по центру сегмент-навигация (3–5 разделов), справа аватар, тема, ⌘K. Без сайдбара: контент приоритетнее. Хром на `--text-2`, активный пункт `--text-1` с подложкой `--surface-3`, анимированной через `layoutId`.
- **Mobile (<768):** нижний таб-бар, стекло, высота 64px + `env(safe-area-inset-bottom)`, иконки 24px с подписями 11px. Топ-бар сокращается до заголовка и одного действия и скрывается при скролле вниз.
- Командная палитра ⌘K: модалка 560px, без анимации открытия (паттерн Raycast), только fade 90 мс.

### 6.2 Карточки
- `surface-1`, border 1px `--border`, радиус `lg` (20), padding 24, `--shadow-sm`.
- Hover (только для интерактивных): border становится `--border-strong`, курсорное свечение, `translateY(-2px)`, `--shadow-md`, 240 мс.
- **Hero-карточка:** радиус `xl`, внутри canvas-визуализация full-bleed, текст поверх с градиентной подложкой снизу.
- Бенто: 12-колоночная сетка desktop / 6 tablet / 1–2 mobile. Hero занимает 8×2, тайлы 4×1.

### 6.3 Кнопки
| Вариант | Спека |
|---|---|
| **Primary** | bg `--accent`, текст `--on-accent`, Onest 600 15px, высота 44 (md) / 36 (sm) / 52 (lg), padding-x 20, радиус `md` (14). Hover: `--accent-soft` + `--shadow-glow`. Active: scale .97. Disabled: opacity .4, без тени |
| **Secondary** | bg `--surface-2`, border `--border`, текст `--text-1`. Hover: `--surface-3` |
| **Ghost** | прозрачный фон, текст `--text-2`. Hover: bg `rgba(text-1, .06)`, текст `--text-1` |
| **Icon** | 40×40 (минимальная зона касания 44×44 через padding/hit-slop), радиус `full` или `sm` |
Фокус у всех кнопок: `outline: 2px solid var(--focus); outline-offset: 2px` (только `:focus-visible`).

### 6.4 Инпуты
- Высота 44, bg `--surface-2`, border 1px `--border-strong`, радиус `sm` (10), padding-x 14, текст body 16px (на iOS 16px не даёт зумить).
- Лейбл сверху: caption 12px `--text-2`, отступ 6. Хинт и ошибка снизу 12px.
- Focus: border `--focus` и `box-shadow 0 0 0 4px color-mix(--focus 20%)`. Error: border `--danger`, иконка и текст.
- Числовые инпуты (дата рождения, доход): моно, `inputmode="numeric"`, крупный вариант 32px для «вопрос-ответ» онбординга.

### 6.5 Слайдеры (ключевой компонент)
- Трек: высота 4px, радиус full, `--surface-3`; заполненная часть градиент от `--accent` к `--accent-soft`.
- Ползунок 20px, белый `--text-1`, тень `--shadow-md`. Hover/drag: 24px плюс кольцо 8px `color-mix(--accent 25%)`.
- Над ползунком при drag плавающий бейдж-значение (моно 13px, стекло).
- Деления: точки 2px `--text-3`. Шаг привязки с haptic-like overshoot.
- A11y: нативный `input[type=range]` или Radix Slider, `aria-valuetext` с человеческим значением («35 лет»), стрелки ±1, PageUp/Down ±10.

### 6.6 Тултипы (графиков и UI)
- Стекло `--blur-sm`, bg `color-mix(--surface-3 85%)`, border `--border`, радиус `sm`, padding 8×12, `--shadow-lg`.
- Контент: overline (категория, цветная точка 8px), значение `body-sm 600` табличное, контекст `caption --text-2`.
- Появление 160 мс, `ease-out`, translateY 4→0. Задержка 300 мс у UI-тултипов, 0 у тултипов данных. Тултип следует за точкой, а не за курсором (snap к данным).
- Mobile: tap-and-hold открывает его, тултип закрепляется над пальцем.

### 6.7 Модалка / шит
- **Modal (desktop):** ширина 480/640, радиус `xl`, `surface-1`, `--shadow-lg`. Оверлей `rgba(5,6,10,.6)` + `blur-lg`. Вход: scale .96→1 + fade, 400 мс ease-emphasized.
- **Sheet (mobile, по умолчанию вместо модалки):** снизу, радиус `xl` только сверху, грабер 36×4 `--text-3`, drag-to-dismiss (пружина gesture), снап-точки 50% / 92%.
- Фокус-ловушка, Esc, возврат фокуса, `aria-modal`. Рекомендуется Radix Dialog / Vaul.

### 6.8 Тосты
- Снизу по центру (mobile, над таб-баром) / снизу справа (desktop). Ширина до 360, стекло, радиус `md`, иконка семантики 16px, текст body-sm, опциональное действие (ghost-кнопка, например «Отменить»).
- Вход: translateY 16→0 + fade, spring UI. Автоскрытие через 4 с (6 с, если есть действие), пауза при hover. Стек до 3 элементов со сдвигом и уменьшением scale.
- `role="status"` (`aria-live="polite"`), для ошибок `role="alert"`.

### 6.9 Пустые состояния
- Это не «нет данных», а **приглашение**: одна тускло мерцающая «звезда» или пунктирный контур будущей визуализации (`stroke-dasharray`, `--text-3`, opacity .4), над ним display-lg курсивом («Здесь появится ваш год»), body `--text-2` до 2 строк, затем primary CTA.
- Медленное «дыхание» контура (opacity .3↔.5, 4 с) отключается при reduced motion.

### 6.10 Стат-тайлы
- Карточка `surface-1`, padding 20–24, минимальная высота 140.
- Состав: overline-лейбл `--text-3` → число `stat-xl` (`--text-1`, единица измерения `body --text-2` рядом, baseline) → дельта-бейдж (pill, ▲/▼ + %, семантический цвет 12% фон) → спарклайн 32px высоты, на всю ширину, 1.5px stroke цветом серии, с градиентной заливкой 0→16%.
- Вариант «эмоциональный»: число Cormorant курсивом, подпись-предложение («…это 4 года на работе»).
- Число тикает при первом появлении во viewport (IntersectionObserver, один раз).

---

## 7. Адаптивность

| Брейкпоинт | Ширина | Правила |
|---|---|---|
| `sm` | ≥640 | 2 колонки бенто |
| `md` | ≥768 | топ-бар вместо таб-бара (опционально с 1024) |
| `lg` | ≥1024 | 12 колонок, hover-эффекты, курсорное свечение |
| `xl` | ≥1280 | max-width 1200 + воздух |

- Mobile-first. Боковые поля 16px (mobile) / 24 (tablet) / 32 (desktop).
- Визуализации: на mobile упрощаем, а не сжимаем (меньше точек: недели превращаются в месяцы, подписи переходят в тултип). Минимальная высота графика 220px. Горизонтальный скролл только внутри графика-таймлайна, со snap и подсказкой-градиентом по краю.
- Зоны касания ≥44×44. Hover-only функциональность запрещена: всё дублируется tap.
- `@media (hover: hover) and (pointer: fine)` для hover-эффектов. `dvh` вместо `vh`, учитываем `safe-area-inset-*`.
- Canvas: `devicePixelRatio` не больше 2, пауза анимаций при `document.hidden` и вне viewport.

## 8. Доступность

- Контраст: текст ≥4.5:1 (крупный ≥3:1), графика и контуры ≥3:1. Все токены выше проверены. `--text-3` в тёмной теме не используем на `--surface-2` для мелкого текста.
- `prefers-reduced-motion: reduce`: длительности ≤120 мс, только opacity; отключены интро-волна, дрейф туманностей, счётчики, параллакс, автоплей.
- `prefers-reduced-transparency`: стекло заменяется непрозрачным `surface-1`. `forced-colors: active`: убираем зерно и glow, рамки `CanvasText`.
- `prefers-color-scheme` задаёт тему по умолчанию + ручной переключатель (`data-theme` на `<html>`), без вспышки при загрузке (inline-скрипт в `<head>`).
- Графики: у каждой визуализации есть `role="img"` + `aria-label` с текстовым резюме («За 2026 год вы потратили 32% времени на сон…») и скрытая таблица данных / «показать как таблицу». Навигация по точкам с клавиатуры (стрелки) с озвучкой значения.
- Цвет не единственный канал: форма, паттерн, подпись. Палитра различима при дейтеранопии (Ember / Glacier как основная пара контраста).
- Фокус всегда видим (`:focus-visible`, кольцо `--focus` 2px + offset 2px).
- Язык документа `lang="ru"`, числа форматируем через `Intl.NumberFormat('ru-RU')`.

---

## 9. Мудборд-референсы

Unsplash-коннектор недоступен (у аккаунта не подтверждён email), поэтому ссылки найдены через веб-поиск (лицензия Unsplash; проверьте бейдж Unsplash+ перед использованием):
1. **Ночное небо / созвездие (концепт «Зажигание»):** https://unsplash.com/photos/the-night-sky-with-stars-and-the-milky-yGY7i8dbeKs (край Млечного Пути, длинная выдержка). Альтернатива: https://unsplash.com/photos/milky-way-over-forest-reflected-in-a-calm-lake-6HZOC_gT14g
2. **Абстрактный тёмный градиент / туманность фона:** https://unsplash.com/photos/a-blurry-image-of-a-ball-and-a-sphere-66YGsVfN25c и подборка https://unsplash.com/trends/abstract-gradient-dark
3. **Плёночное зерно / light leak:** https://unsplash.com/photos/abstract-film-light-leak-texture-3Szj0xijzX8 (может быть Unsplash+), подборка https://unsplash.com/s/photos/noise-texture

Это **референсы настроения, а не ассеты**: в продукте фон, туманности и зерно генерируются CSS/SVG/canvas (без растров, меньше веса, адаптируется к теме).

Концептуальные референсы: Giorgia Lupi «Dear Data» / Data Humanism (рукописность, контекст, несовершенство данных); Nadieh Bremer / Visual Cinnamon (SVG-градиенты по данным, glow-фильтры); Linear (тихий хром, темы на LCH); Raycast (мгновенность частых действий).

---

## 10. CSS: готовый блок (Tailwind v4)

Положить в `src/styles/theme.css` и импортировать после `@import "tailwindcss";`. Сырые значения живут в `:root` / `[data-theme]`, а `@theme inline` пробрасывает их в утилиты Tailwind (`bg-bg`, `text-text-1`, `bg-accent`, `rounded-lg`, `shadow-md`, `ease-out-quint`, `font-display` и т. д.), так что смена темы работает без пересборки.

```css
@import "tailwindcss";

/* ---------- Raw tokens: DARK (default) ---------- */
:root {
  color-scheme: dark;

  /* surfaces */
  --bg: #0B0D14;
  --bg-zenith: #151A2E;
  --surface-1: #12151F;
  --surface-2: #1A1E2B;
  --surface-3: #232838;
  --border: rgba(237, 234, 227, 0.08);
  --border-strong: rgba(237, 234, 227, 0.16);
  --overlay: rgba(5, 6, 10, 0.6);

  /* text */
  --text-1: #EDEAE3;
  --text-2: #A9ABB8;
  --text-3: #7E8296;

  /* brand */
  --accent: #FF8A5B;
  --accent-soft: #FFB38A;
  --on-accent: #0B0D14;
  --focus: #6AA8FF;

  /* data viz (fixed order) */
  --data-1: #FF8A5B; /* Ember   */
  --data-2: #F2C14E; /* Amber   */
  --data-3: #5ED6B0; /* Aurora  */
  --data-4: #6AA8FF; /* Glacier */
  --data-5: #C38BFF; /* Orchid  */

  /* semantic */
  --success: #4FD18B;
  --warning: #F2C14E;
  --danger: #FF6B6B;
  --info: #6AA8FF;

  /* elevation */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
  --shadow-md: 0 8px 24px -6px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05);
  --shadow-lg: 0 24px 64px -12px rgba(0,0,0,.6), 0 8px 20px -8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06);
  --shadow-glow: 0 0 0 1px color-mix(in oklch, var(--accent) 40%, transparent),
                 0 8px 32px -4px color-mix(in oklch, var(--accent) 45%, transparent);

  /* glass */
  --glass-bg: color-mix(in oklch, var(--surface-1) 72%, transparent);
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 32px;

  /* grain */
  --grain-opacity: 0.06;
  --grain-blend: overlay;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");

  /* motion */
  --dur-instant: 90ms;
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 400ms;
  --dur-story: 800ms;
  --dur-epic: 1600ms;
}

/* ---------- Raw tokens: LIGHT ("Paper") ---------- */
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #F6F3EE;
  --bg-zenith: #FFFFFF;
  --surface-1: #FFFFFF;
  --surface-2: #EEEAE3;
  --surface-3: #E4DFD6;
  --border: rgba(22, 23, 29, 0.08);
  --border-strong: rgba(22, 23, 29, 0.16);
  --overlay: rgba(22, 23, 29, 0.32);

  --text-1: #16171D;
  --text-2: #55586A;
  --text-3: #6B6E7D;

  --accent: #C2451C;
  --accent-soft: #D2552A;
  --on-accent: #FFFFFF;
  --focus: #2F6BDB;

  --data-1: #D2552A;
  --data-2: #A87508;
  --data-3: #13896A;
  --data-4: #2F6BDB;
  --data-5: #8A4FD6;

  --success: #1E8A50;
  --warning: #A87508;
  --danger: #D23B3B;
  --info: #2F6BDB;

  --shadow-sm: 0 1px 2px rgba(22,23,29,.06);
  --shadow-md: 0 8px 24px -6px rgba(22,23,29,.10), 0 2px 6px rgba(22,23,29,.06);
  --shadow-lg: 0 24px 64px -12px rgba(22,23,29,.16), 0 8px 20px -8px rgba(22,23,29,.08);

  --grain-opacity: 0.04;
  --grain-blend: multiply;
}

/* Follow OS when user hasn't chosen explicitly */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --bg: #F6F3EE; --bg-zenith: #FFFFFF;
    --surface-1: #FFFFFF; --surface-2: #EEEAE3; --surface-3: #E4DFD6;
    --border: rgba(22,23,29,.08); --border-strong: rgba(22,23,29,.16); --overlay: rgba(22,23,29,.32);
    --text-1: #16171D; --text-2: #55586A; --text-3: #6B6E7D;
    --accent: #C2451C; --accent-soft: #D2552A; --on-accent: #FFFFFF; --focus: #2F6BDB;
    --data-1: #D2552A; --data-2: #A87508; --data-3: #13896A; --data-4: #2F6BDB; --data-5: #8A4FD6;
    --success: #1E8A50; --warning: #A87508; --danger: #D23B3B; --info: #2F6BDB;
    --shadow-sm: 0 1px 2px rgba(22,23,29,.06);
    --shadow-md: 0 8px 24px -6px rgba(22,23,29,.10), 0 2px 6px rgba(22,23,29,.06);
    --shadow-lg: 0 24px 64px -12px rgba(22,23,29,.16), 0 8px 20px -8px rgba(22,23,29,.08);
    --grain-opacity: .04; --grain-blend: multiply;
  }
}

/* ---------- Tailwind v4 theme mapping ---------- */
@theme inline {
  /* colors -> bg-*, text-*, border-*, fill-*, stroke-* */
  --color-bg: var(--bg);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-text-1: var(--text-1);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-on-accent: var(--on-accent);
  --color-focus: var(--focus);
  --color-data-1: var(--data-1);
  --color-data-2: var(--data-2);
  --color-data-3: var(--data-3);
  --color-data-4: var(--data-4);
  --color-data-5: var(--data-5);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);

  /* shadows */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-glow: var(--shadow-glow);
}

@theme {
  /* fonts -> font-display, font-sans, font-mono */
  --font-display: "Cormorant Garamond", "Iowan Old Style", Georgia, serif;
  --font-sans: "Onest", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* type scale -> text-* */
  --text-display-2xl: clamp(3.5rem, 2rem + 6vw, 7.5rem);
  --text-display-2xl--line-height: 0.95;
  --text-display-2xl--letter-spacing: -0.03em;
  --text-display-xl: clamp(2.75rem, 1.8rem + 3.6vw, 5rem);
  --text-display-xl--line-height: 1;
  --text-display-xl--letter-spacing: -0.025em;
  --text-display-lg: clamp(2.25rem, 1.7rem + 2vw, 3.5rem);
  --text-display-lg--line-height: 1.05;
  --text-display-lg--letter-spacing: -0.02em;
  --text-h1: 2rem;      --text-h1--line-height: 1.15; --text-h1--letter-spacing: -0.015em;
  --text-h2: 1.5rem;    --text-h2--line-height: 1.2;  --text-h2--letter-spacing: -0.01em;
  --text-h3: 1.25rem;   --text-h3--line-height: 1.3;  --text-h3--letter-spacing: -0.005em;
  --text-body-lg: 1.125rem; --text-body-lg--line-height: 1.55;
  --text-body: 1rem;        --text-body--line-height: 1.55;
  --text-body-sm: 0.875rem; --text-body-sm--line-height: 1.5;  --text-body-sm--letter-spacing: 0.005em;
  --text-caption: 0.75rem;  --text-caption--line-height: 1.4;  --text-caption--letter-spacing: 0.02em;
  --text-overline: 0.6875rem; --text-overline--line-height: 1.3; --text-overline--letter-spacing: 0.12em;
  --text-stat-xl: clamp(2.5rem, 1.6rem + 3.2vw, 4.5rem);
  --text-stat-xl--line-height: 1; --text-stat-xl--letter-spacing: -0.02em;
  --text-mono-sm: 0.8125rem; --text-mono-sm--line-height: 1.4;

  /* spacing base: p-1 = 4px */
  --spacing: 0.25rem;

  /* radii -> rounded-* */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* blur -> backdrop-blur-* */
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 32px;

  /* easing -> ease-* */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-quint: cubic-bezier(0.55, 0, 1, 0.45);
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* animations -> animate-* */
  --animate-fade-up: fade-up var(--dur-base, 240ms) cubic-bezier(0.22, 1, 0.36, 1) both;
  --animate-breathe: breathe 4s ease-in-out infinite;
  --animate-drift: drift 60s ease-in-out infinite alternate;

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); filter: blur(6px); }
    to   { opacity: 1; transform: none; filter: none; }
  }
  @keyframes breathe {
    0%, 100% { opacity: .3; } 50% { opacity: .5; }
  }
  @keyframes drift {
    from { transform: translate3d(-4%, -2%, 0) scale(1); }
    to   { transform: translate3d(4%, 3%, 0) scale(1.08); }
  }
}

/* ---------- Base layer ---------- */
@layer base {
  html {
    background: var(--bg);
    color: var(--text-1);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  body {
    min-height: 100dvh;
    background:
      radial-gradient(120% 80% at 50% -10%, var(--bg-zenith), var(--bg) 60%) fixed,
      var(--bg);
  }
  /* film grain overlay */
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 100;
    pointer-events: none;
    background-image: var(--grain);
    background-size: 160px 160px;
    opacity: var(--grain-opacity);
    mix-blend-mode: var(--grain-blend);
  }
  :focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  ::selection { background: color-mix(in oklch, var(--accent) 35%, transparent); }
  .tabular { font-variant-numeric: tabular-nums lining-nums; }
}

/* ---------- Utilities ---------- */
@utility glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(140%);
  backdrop-filter: blur(var(--blur-md)) saturate(140%);
  border: 1px solid var(--border);
}
@utility card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
@utility cursor-glow {
  background-image: radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklch, var(--text-1) 6%, transparent), transparent 60%);
}

@supports not (backdrop-filter: blur(1px)) {
  .glass { background: var(--surface-1); }
}

/* ---------- Accessibility preferences ---------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms !important;
    transition-property: opacity, color, background-color, border-color !important;
    scroll-behavior: auto !important;
  }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation: none !important;
  }
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--surface-1); backdrop-filter: none; }
}
@media (forced-colors: active) {
  body::after { display: none; }
}

/* ---------- Page transitions (View Transitions API) ---------- */
::view-transition-old(root) {
  animation: 160ms cubic-bezier(0.55, 0, 1, 0.45) both vt-out;
}
::view-transition-new(root) {
  animation: 400ms cubic-bezier(0.2, 0, 0, 1) both vt-in;
}
@keyframes vt-out { to { opacity: 0; transform: translateY(-8px); } }
@keyframes vt-in  { from { opacity: 0; transform: translateY(12px); filter: blur(6px); } }
```

**Без вспышки темы** (в `index.html` до бандла):
```html
<script>
  try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}
</script>
```

**Рекомендуемые библиотеки:** `motion` (Motion for React: пружины, `layoutId`, AnimatePresence), Radix UI primitives / Vaul (доступные модалки, шиты, слайдеры, тултипы), `d3-scale` / `d3-shape` + собственный SVG/Canvas (а не тяжёлые chart-киты: нужен data-art, а не дашборд), опционально `ogl` или `three` для WebGL-интро «Зажигание».

---

## Источники
- [Digidop — 5 Web Design Trends for 2026](https://www.digidop.com/blog/5-web-design-trends-2025/index.md)
- [StudioMeyer — Webdesign trends 2026](https://studiomeyer.io/en/blog/webdesign-trends-2026.md)
- [DesignRush — 15 Web Design Trends for 2026](https://www.designrush.com/trends/design-trends)
- [Linear — Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear changelog — UI refresh 2026-03-12](https://linear-web.pages.dev/changelog/2026-03-12-ui-refresh)
- [sspai — обзор дизайн-стиля Linear](https://sspai.com/post/104449)
- [Setproduct — Liquid glass vs glassmorphism (2026)](https://setproduct.com/blog/liquid-glass-vs-glassmorphism)
- [daisyUI — 18 UI design trends for 2026](https://trends.daisyui.com/ui-design-trends-2026/)
- [Pixelmatters — UI design trends](https://pixelmatters.com/insights/7-UI-design-trends-to-watch-in-2026)
- [Giorgia Lupi — Wikipedia](https://en.wikipedia.org/wiki/Giorgia_Lupi)
- [Data Humanism Decoded (arXiv 2509.00440)](https://arxiv.org/abs/2509.00440v1)
- [Nadieh Bremer — Wikipedia](https://en.wikipedia.org/wiki/Nadieh_Bremer)
- [KIKK 2019 — Nadieh Bremer workshop (SVG gradients & filters)](https://2019.kikk.be/en/program/workshops-masterclasses/nadieh-bremer-1)
- [Emil Kowalski design-engineering guidance (spring/easing)](https://www.ui-skills.com/skills/emilkowalski/emil-design-eng)
- [Raycast — kinetic product motion](https://contra.com/p/llNMeeMX-kinetic-product-motion-for-raycast-making-a-ui-feel-alive)
- Unsplash-страницы, перечисленные в разделе 9.

*Ограничения: прямой WebFetch к linear.app заблокирован сетевыми настройками сессии, поэтому данные о Linear взяты из сниппетов поиска. Unsplash MCP вернул ошибку «email не подтверждён». Наличие кириллицы у выбранных шрифтов перепроверить на fonts.google.com перед интеграцией.*
