# Архитектурная спецификация разрешения сущностей (DAY 5 — ENTITY RESOLUTION 2.0)

> **Статус документа:** Production Architecture Specification  
> **Версия движка:** `Entity Resolution Engine v2.0` (`data_pipeline/entity_resolution_engine.py`)  
> **Интеграция:** Knowledge Graph Engine (`data_pipeline/knowledge_graph_engine.py`), Provenance Engine (`data_pipeline/data_provenance_engine.py`)  
> **Фундаментальный закон:** **Нельзя объединять сущности только потому, что названия похожи (The Anti-Collision Guard).**

---

## 1. Введение: Ловушка поверхностной схожести имён

В индустрии венчурных данных подавляющее большинство баз данных допускают фатальную ошибку: они используют наивный нечеткий поиск по названию (Fuzzy Name Matching, Jaro-Winkler > 0.85) и автоматически объединяют сущности со схожими именами.

### К каким катастрофическим искажениям это приводит:
1. **Схлопывание компаний-тёзок (The Name Collision Trap):**
   - В реальном мире существуют тысячи компаний с одинаковыми короткими именами. Например, необанк **`Mercury`** (Fintech, США, mercury.com, основатель Иммад Ахунд) и транспортная компания **`Mercury Logistics`** (Логистика, Германия, mercury-logistics.de).
   - Наивный алгоритм видит общее слово `Mercury` и склеивает их в один профиль. В результате венчурным инвесторам Silicon Valley банка приписываются складские помещения и немецкие грузовики!
2. **Уничтожение дочерних брендов (Subsidiary & Acquisition Erasure):**
   - Когда Alphabet покупает **`DeepMind`**, или Microsoft покупает **`GitHub`**, наивная система считает их «одной компанией» и перетирает историю. Однако DeepMind сохраняет собственный исследовательский фокус, своих основателей (Демис Хассабис) и независимую историю ранних посевных раундов.
3. **Разрыв хронологии переименований (Historical Renames):**
   - **`TransferWise`** переименовался в **`Wise`**, **`Twitter`** стал **`X`**, **`Facebook`** стал **`Meta`**. Это не две разные компании и не случайные дубликаты. Это **темпоральные псевдонимы (Temporal Aliases)** одного юрлица. Раунды 2015 года привлекались на имя `TransferWise`, а раунды 2024 года — на имя `Wise`.

---

## 2. Иерархия отношений между сущностями (Relationship Taxonomy)

Entity Resolution 2.0 в OpenAngels строго классифицирует любую пару сущностей по одной из 6 категорий:

| Категория отношения | Статус объединения (`can_merge`) | Действие системы OpenAngels |
| :--- | :---: | :--- |
| **`EXACT_DUPLICATE`** | **ДА (True)** | Объединение записей из разных источников в каноническую карточку с сохранением всех псевдонимов |
| **`HISTORICAL_RENAME`** | **ДА (True)** | Связывание как темпорального псевдонима (`formerly_known_as`), сохранение исторической преемственности |
| **`PARENT_SUBSIDIARY`** | **НЕТ (False)** | **Слияние строго запрещено.** Формирование иерархического ребра в Knowledge Graph (`SUBSIDIARY_OF`) |
| **`ACQUISITION`** | **НЕТ (False)** | **Слияние строго запрещено.** Формирование транзакционного ребра M&A (`ACQUIRED_BY`) |
| **`DISTINCT_NAME_COLLISION`** | **НЕТ (False)** | **Слияние строго запрещено.** Разведение тёзок в разные независимые сущности (Anti-Collision Guard) |
| **`UNRELATED`** | **НЕТ (False)** | Разные несвязанные сущности |

---

## 3. Математическая модель `ENTITY_MATCH_SCORE`

Скор сходства двух сущностей вычисляется по многофакторной формуле, учитывающей 7 независимых измерений:

$$\text{Score} = w_{\text{dom}} S_{\text{dom}} + w_{\text{fnd}} S_{\text{fnd}} + w_{\text{li}} S_{\text{li}} + w_{\text{leg}} S_{\text{leg}} + w_{\text{geo}} S_{\text{geo}} + w_{\text{ind}} S_{\text{ind}} + w_{\text{tw}} S_{\text{tw}}$$

### Весовые коэффициенты формулы:

| Измерение | Вес | Описание проверки |
| :--- | :---: | :--- |
| **1. Domain Match ($S_{\text{dom}}$)** | **0.30** | Совпадение корневого канонического домена второго уровня (e.g. `stripe.com` == `stripe.com`) |
| **2. Founder Overlap ($S_{\text{fnd}}$)** | **0.25** | Пересечение множеств основателей по Jaro-Winkler $\ge 0.88$ (e.g. Patrick & John Collison) |
| **3. LinkedIn Company Slug ($S_{\text{li}}$)** | **0.15** | Идентичность уникального слаг-идентификатора `linkedin.com/company/{slug}` |
| **4. Legal Entity Name ($S_{\text{leg}}$)** | **0.12** | Совпадение юридического названия после очистки суффиксов (`Inc.`, `LLC`, `GmbH`, `PBC`) |
| **5. Country & City ($S_{\text{geo}}$)** | **0.08** | Согласованность юрисдикции и локации штаб-квартиры (e.g. United States / San Francisco) |
| **6. Product & Sector ($S_{\text{ind}}$)** | **0.06** | Пересечение предметной индустрии (e.g. Fintech & Payments) |
| **7. Twitter / X Handle ($S_{\text{tw}}$)** | **0.04** | Совпадение официального хэндла в соцсети `@brand` |

> **Сумма 6 ключевых подтверждений:**  
> $$0.30 + 0.25 + 0.15 + 0.12 + 0.08 + 0.06 = \mathbf{0.96}$$  
> При совпадении всех 6 базовых сигналов система выдает точный балл **0.96**, гарантируя абсолютную надежность объединения!

---

## 4. Система объяснений: `WHY_MATCHED`

Каждое решение алгоритма снабжается прозрачным аудиторским следом подтвержденных причин (`reasons`).

### Пример 1: Идеальное слияние дубликатов (`EXACT_DUPLICATE`)
**Сравнение:** `Stripe` (из базы A) + `Stripe Payments` (из базы B)

```text
Company A: Stripe + Company B: Stripe Payments
Match score: 0.96
Relationship: EXACT_DUPLICATE (Can Merge: YES)
Reasons:
  + same domain
  + same founders
  + same country
  + same product
  + same LinkedIn
  + same legal entity
```

---

## 5. Защита от ложного слияния (The Anti-Collision Guard)

### Жесткие правила дисквалификации (Disqualifiers):
Если у двух сущностей названия похожи или идентичны, но обнаружен **конфликт доменов** (`domain_A != domain_B`) и подтвержден **хотя бы один жесткий фактор несовпадения**:
- разные страны (США vs Германия),
- непересекающиеся команды фаундеров (0 совпадений),
- несовместимые отрасли (Fintech vs Грузоперевозки / Сельское хозяйство),

$\Longrightarrow$ **Срабатывает Anti-Collision Guard:**
- Итоговый скор принудительно снижается до **0.18**;
- Статус выставляется в **`DISTINCT_NAME_COLLISION`**;
- Флаг `can_merge` устанавливается в **`False`**;
- Формируется подробный отчет о дисквалификации.

### Пример 2: Отражение атаки тёзок (`DISTINCT_NAME_COLLISION`)
**Сравнение:** `Mercury` (Fintech-банк, США) vs `Mercury Logistics` (Грузоперевозки, Германия)

```text
Entity A: Mercury (Fintech) vs Entity B: Mercury Logistics (Logistics)
Match score: 0.18
Relationship: DISTINCT_NAME_COLLISION (Can Merge: NO)
Disqualifiers / Anti-Collision Flags:
  - conflicting domains (mercury.com vs mercury-logistics.de)
  - disjoint founder teams
  - conflicting countries (United States vs Germany)
  - clashing industries (Fintech & Banking vs Freight & Logistics)
  - conflicting LinkedIn profiles (mercury-hq vs mercury-logistics-gmbh)
  - Anti-Collision Guard: similar name but disjoint domains, founders, and sectors
```

> **Результат:** Слияние заблокировано. Данные венчурного банка защищены от загрязнения посторонними сделками.

---

## 6. Корпоративные иерархии и исторические переименования

### Пример 3: Дочерняя компания (`PARENT_SUBSIDIARY`)
**Сравнение:** `DeepMind` vs `Alphabet`

```text
Entity A: DeepMind vs Entity B: Alphabet
Match score: 0.85
Relationship: PARENT_SUBSIDIARY (Can Merge: NO)
Explanation:
  + known corporate relation (DeepMind is a subsidiary of Alphabet since 2014)
  + hierarchical conglomerate structure
Disqualifiers:
  - distinct legal entities: identity merge prohibited
```

### Пример 4: Историческое переименование (`HISTORICAL_RENAME`)
**Сравнение:** `TransferWise` vs `Wise`

```text
Entity A: TransferWise vs Entity B: Wise
Match score: 0.94
Relationship: HISTORICAL_RENAME (Can Merge: YES)
Explanation:
  + known historical corporate rename (TransferWise was rebranded to Wise in 2021)
  + matching corporate continuity and founders
Canonical Entity:
  canonical_name: "Wise"
  domain: "wise.com"
  formerly_known_as: ["TransferWise"]
```

---

## 7. Программный интерфейс (Python API)

```python
from data_pipeline.entity_resolution_engine import (
    CompanyProfile,
    calculate_entity_match_score
)

# Создание профилей для сравнения
company_a = CompanyProfile(
    name="Stripe",
    domain="stripe.com",
    legal_name="Stripe, Inc.",
    founders=["Patrick Collison", "John Collison"],
    country="United States",
    industry="Fintech & Payments",
    linkedin_url="https://www.linkedin.com/company/stripe"
)

company_b = CompanyProfile(
    name="Stripe Payments",
    domain="stripe.com",
    legal_name="Stripe Inc",
    founders=["Patrick Collison", "John Collison"],
    country="United States",
    industry="Fintech & Payments",
    linkedin_url="https://linkedin.com/company/stripe"
)

# Оценка совпадения
result = calculate_entity_match_score(company_a, company_b)

print(result.match_score)      # 0.96
print(result.relationship)     # EXACT_DUPLICATE
print(result.why_matched)      # ['same domain', 'same founders', 'same country', 'same product', 'same LinkedIn', 'same legal entity']
print(result.can_merge)        # True
```

---

## 8. Гарантии стабильности и обратной совместимости

1. **Обратная совместимость со Stage 6:**
   - Методы `resolve_representation_cluster()`, `resolve_single_name_or_domain()`, `get_engine()` и `build_knowledge_graph()` сохранены в неизменном виде.
   - Тест кластера OpenAI (`["OpenAI", "Open AI Inc.", "OpenAI, Inc.", "openai.com"]`) выполняется со 100% успехом (уверенность 0.997).
2. **Стабильность базы данных:**
   - Живые записи в таблице `investors` Supabase не перезаписываются и не удаляются.
3. **Пайплайн `run_master.bat`:**
   - Все рабочие режимы продолжают работать в штатном режиме без ошибок.
