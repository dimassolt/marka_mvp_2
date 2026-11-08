# Demo cases

Test texts with known results, for the live demo and for checks. All names and numbers are fictional; the fødselsnummer, account, card and IBAN are synthetic with valid checksums.

`cases.json` holds the same cases with exact offsets. Two tests keep both files honest:

- `engine/tests/test_demo_cases.py` runs every text through the Engine and compares the Findings (needs the GLiNER model).
- `extension/utils/demo-cases.test.ts` runs Hide all through the Vault and compares the text and the Vault.

## How to run one

1. Start the Engine and the Extension (`make start`).
2. In the popup, pick the Domain the case names. For case 13, make a Domain `Prosjekt` with the words `Nordlys` and `Fjell*`.
3. Paste the text into chatgpt.com.
4. Check the underlines and the Ghost bar count.
5. Click the Ghost bar, then **Hide all**. Use a new tab for each case: the Vault is per tab, so numbering starts at 1.

## Overview

| # | Case | Domain | Ghost bar |
|---|---|---|---|
| 01 | [Name, phone and email](#01-contact) | free | 4 |
| 02 | [Bank account, fødselsnummer and card](#02-ids) | free | 3 |
| 03 | [IBAN and password](#03-iban-password) | free | 2 |
| 04 | [One person, three spellings](#04-same-person) | free | 3 |
| 05 | [Two people with the same first name](#05-two-people) | free | 4 |
| 06 | [Text that is already hidden](#06-placeholders) | free | — |
| 07 | [Health: the demo note](#07-health-demo-note) | health | 9 |
| 08 | [Health in English](#08-health-english) | health | 6 |
| 09 | [Education: one student](#09-education) | education | 7 |
| 10 | [Courts: closed case](#10-courts) | courts | 6 |
| 11 | [Industrial: plant details](#11-industrial) | industrial | 7 |
| 12 | [Religious: pastoral care](#12-religious) | religious | 6 |
| 13 | [Your own Domain](#13-own-words) | Prosjekt | 3 |
| 14 | [Organisation and place](#14-org-place) | free | 3 |
| 15 | [Negative: service time](#15-neg-church) | religious | — |
| 16 | [Negative: class average](#16-neg-class) | education | — |
| 17 | [Negative: failed checksum](#17-neg-checksum) | free | — |
| 18 | [Negative: published decision](#18-neg-published) | courts | — |

Colours: red for ids (fnr, account, card, IBAN, password), amber for contact (names, phone, email), teal for Domain words, your own words, organisations and places.

<a id="01-contact"></a>

## 01. Name, phone and email

Base checks on the Free Domain. The first name alone is found again.

**Domain:** `free`

**Paste:**

```text
Hei! Jeg heter Ingrid Solberg. Ring meg på 912 34 567 eller skriv til ingrid.solberg@example.com. Ingrid svarer etter klokken 16.
```

**Underlined (4):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Ingrid Solberg` | person_name | amber | `[PERSON_1]` |
| `912 34 567` | phone | amber | `[PHONE_1]` |
| `ingrid.solberg@example.com` | email | amber | `[EMAIL_1]` |
| `Ingrid` | person_name | amber | `[PERSON_1]` |

**After Hide all:**

```text
Hei! Jeg heter [PERSON_1]. Ring meg på [PHONE_1] eller skriv til [EMAIL_1]. [PERSON_1] svarer etter klokken 16.
```

**Vault:** `[PERSON_1]` → Ingrid Solberg, `[PHONE_1]` → 912 34 567, `[EMAIL_1]` → ingrid.solberg@example.com

<a id="02-ids"></a>

## 02. Bank account, fødselsnummer and card

Checksums: mod-11 for account and fnr, Luhn for the card. Red underlines.

**Domain:** `free`

**Paste:**

```text
Lønnen går til konto 8601.11.17947. Fødselsnummeret mitt er 010190 00083, og kortet er 4111 1111 1111 1111.
```

**Underlined (3):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `8601.11.17947` | bank_account | red | `[ACCOUNT_1]` |
| `010190 00083` | fodselsnummer | red | `[FNR_1]` |
| `4111 1111 1111 1111` | payment_card | red | `[CARD_1]` |

**After Hide all:**

```text
Lønnen går til konto [ACCOUNT_1]. Fødselsnummeret mitt er [FNR_1], og kortet er [CARD_1].
```

**Vault:** `[ACCOUNT_1]` → 8601.11.17947, `[FNR_1]` → 010190 00083, `[CARD_1]` → 4111 1111 1111 1111

<a id="03-iban-password"></a>

## 03. IBAN and password

IBAN with mod-97. Only the value after the label is the password.

**Domain:** `free`

**Paste:**

```text
Betal til IBAN NO93 8601 1117 947 innen fredag. Passord: Sommer2026
```

**Underlined (2):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `NO93 8601 1117 947` | iban | red | `[IBAN_1]` |
| `Sommer2026` | password | red | `[PASSWORD_1]` |

**After Hide all:**

```text
Betal til IBAN [IBAN_1] innen fredag. Passord: [PASSWORD_1]
```

**Vault:** `[IBAN_1]` → NO93 8601 1117 947, `[PASSWORD_1]` → Sommer2026

<a id="04-same-person"></a>

## 04. One person, three spellings

Full name, first name and surname all get [PERSON_1].

**Domain:** `free`

**Paste:**

```text
Ola Nordmann er syk i dag. Ola kommer tilbake på mandag. Ring Nordmann hvis det haster.
```

**Underlined (3):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Ola Nordmann` | person_name | amber | `[PERSON_1]` |
| `Ola` | person_name | amber | `[PERSON_1]` |
| `Nordmann` | person_name | amber | `[PERSON_1]` |

**After Hide all:**

```text
[PERSON_1] er syk i dag. [PERSON_1] kommer tilbake på mandag. Ring [PERSON_1] hvis det haster.
```

**Vault:** `[PERSON_1]` → Ola Nordmann

<a id="05-two-people"></a>

## 05. Two people with the same first name

Ola Nordmann and Ola Hansen stay apart. Each surname follows its own person.

**Domain:** `free`

**Paste:**

```text
Ola Nordmann og Ola Hansen var på møtet. Hansen tok notater, og Nordmann ledet.
```

**Underlined (4):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Ola Nordmann` | person_name | amber | `[PERSON_1]` |
| `Ola Hansen` | person_name | amber | `[PERSON_2]` |
| `Hansen` | person_name | amber | `[PERSON_2]` |
| `Nordmann` | person_name | amber | `[PERSON_1]` |

**After Hide all:**

```text
[PERSON_1] og [PERSON_2] var på møtet. [PERSON_2] tok notater, og [PERSON_1] ledet.
```

**Vault:** `[PERSON_1]` → Ola Nordmann, `[PERSON_2]` → Ola Hansen

<a id="06-placeholders"></a>

## 06. Text that is already hidden

Placeholders are never underlined again. Zero Findings.

**Domain:** `free`

**Paste:**

```text
Send rapporten fra [PERSON_1] til [EMAIL_1] før fredag. [PERSON_1] er syk.
```

**Underlined:** nothing. No Ghost bar.

<a id="07-health-demo-note"></a>

## 07. Health: the demo note

docs/spec.md §5. Ghost bar shows 9. Bærum is a place.

**Domain:** `health`

**Paste:**

```text
Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter Kari Nordmann, fnr 01019000083. Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1. Hun er sykemeldt og bruker insulin. Ring henne på +47 912 34 567 eller send e-post til kari.nordmann@example.com.
```

**Underlined (9):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Kari Nordmann` | person_name | amber | `[PERSON_1]` |
| `01019000083` | fodselsnummer | red | `[FNR_1]` |
| `Kari` | person_name | amber | `[PERSON_1]` |
| `Bærum` | location | teal | `[DATA_1]` |
| `diabetes` | health | teal | `[HEALTH_1]` |
| `sykemeldt` | health | teal | `[HEALTH_2]` |
| `insulin` | health | teal | `[HEALTH_3]` |
| `+47 912 34 567` | phone | amber | `[PHONE_1]` |
| `kari.nordmann@example.com` | email | amber | `[EMAIL_1]` |

**After Hide all:**

```text
Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter [PERSON_1], fnr [FNR_1]. [PERSON_1], 34 år, jobber som lærer i [DATA_1] og har [HEALTH_1] type 1. Hun er [HEALTH_2] og bruker [HEALTH_3]. Ring henne på [PHONE_1] eller send e-post til [EMAIL_1].
```

**Vault:** `[PERSON_1]` → Kari Nordmann, `[FNR_1]` → 01019000083, `[DATA_1]` → Bærum, `[HEALTH_1]` → diabetes, `[HEALTH_2]` → sykemeldt, `[HEALTH_3]` → insulin, `[PHONE_1]` → +47 912 34 567, `[EMAIL_1]` → kari.nordmann@example.com

<a id="08-health-english"></a>

## 08. Health in English

English health words, an international phone number, two people.

**Domain:** `health`

**Paste:**

```text
Sarah Johnson saw John Peterson today. John has type 2 diabetes and is on sick leave. Call him at +44 20 7946 0958.
```

**Underlined (6):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Sarah Johnson` | person_name | amber | `[PERSON_1]` |
| `John Peterson` | person_name | amber | `[PERSON_2]` |
| `John` | person_name | amber | `[PERSON_2]` |
| `diabetes` | health | teal | `[HEALTH_1]` |
| `sick leave` | health | teal | `[HEALTH_2]` |
| `+44 20 7946 0958` | phone | amber | `[PHONE_1]` |

**After Hide all:**

```text
[PERSON_1] saw [PERSON_2] today. [PERSON_2] has type 2 [HEALTH_1] and is on [HEALTH_2]. Call him at [PHONE_1].
```

**Vault:** `[PERSON_1]` → Sarah Johnson, `[PERSON_2]` → John Peterson, `[HEALTH_1]` → diabetes, `[HEALTH_2]` → sick leave, `[PHONE_1]` → +44 20 7946 0958

<a id="09-education"></a>

## 09. Education: one student

Special needs, absence and grades about a named student.

**Domain:** `education`

**Paste:**

```text
Emma Berg i 9B har IOP og mye fravær. Hun fikk 2 i standpunkt i matte, og Berg har en sakkyndig vurdering fra PPT.
```

**Underlined (7):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Emma Berg` | person_name | amber | `[PERSON_1]` |
| `IOP` | education | teal | `[EDUCATION_1]` |
| `fravær` | education | teal | `[EDUCATION_2]` |
| `standpunkt` | education | teal | `[EDUCATION_3]` |
| `Berg` | person_name | amber | `[PERSON_1]` |
| `sakkyndig vurdering` | education | teal | `[EDUCATION_4]` |
| `PPT` | education | teal | `[EDUCATION_5]` |

**After Hide all:**

```text
[PERSON_1] i 9B har [EDUCATION_1] og mye [EDUCATION_2]. Hun fikk 2 i [EDUCATION_3] i matte, og [PERSON_1] har en [EDUCATION_4] fra [EDUCATION_5].
```

**Vault:** `[PERSON_1]` → Emma Berg, `[EDUCATION_1]` → IOP, `[EDUCATION_2]` → fravær, `[EDUCATION_3]` → standpunkt, `[EDUCATION_4]` → sakkyndig vurdering, `[EDUCATION_5]` → PPT

<a id="10-courts"></a>

## 10. Courts: closed case

Closed hearing, a draft judgment not yet announced, a custody detail.

**Domain:** `courts`

**Paste:**

```text
Saken mot Per Olsen går for lukkede dører. Utkast til dom er klart, men dommen er ikke avsagt. Olsen har samvær annenhver helg.
```

**Underlined (6):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Per Olsen` | person_name | amber | `[PERSON_1]` |
| `lukkede dører` | courts | teal | `[COURTS_1]` |
| `Utkast til dom` | courts | teal | `[COURTS_2]` |
| `ikke avsagt` | courts | teal | `[COURTS_3]` |
| `Olsen` | person_name | amber | `[PERSON_1]` |
| `samvær` | courts | teal | `[COURTS_4]` |

**After Hide all:**

```text
Saken mot [PERSON_1] går for [COURTS_1]. [COURTS_2] er klart, men dommen er [COURTS_3]. [PERSON_1] har [COURTS_4] annenhver helg.
```

**Vault:** `[PERSON_1]` → Per Olsen, `[COURTS_1]` → lukkede dører, `[COURTS_2]` → Utkast til dom, `[COURTS_3]` → ikke avsagt, `[COURTS_4]` → samvær

<a id="11-industrial"></a>

## 11. Industrial: plant details

Machine makers, capacity, a site name and a contact.

**Domain:** `industrial`

**Paste:**

```text
Linje 2 på Anlegg Nord har 14 Fanuc-roboter og to Trumpf-lasere. Kapasiteten er 2400 enheter per skift. Kontakt Lars Eriksen på 98765432.
```

**Underlined (7):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Anlegg Nord` | location | teal | `[DATA_1]` |
| `Fanuc` | industrial | teal | `[INDUSTRIAL_1]` |
| `Trumpf` | industrial | teal | `[INDUSTRIAL_2]` |
| `Kapasiteten` | industrial | teal | `[INDUSTRIAL_3]` |
| `enheter per skift` | industrial | teal | `[INDUSTRIAL_4]` |
| `Lars Eriksen` | person_name | amber | `[PERSON_1]` |
| `98765432` | phone | amber | `[PHONE_1]` |

**After Hide all:**

```text
Linje 2 på [DATA_1] har 14 [INDUSTRIAL_1]-roboter og to [INDUSTRIAL_2]-lasere. [INDUSTRIAL_3] er 2400 [INDUSTRIAL_4]. Kontakt [PERSON_1] på [PHONE_1].
```

**Vault:** `[DATA_1]` → Anlegg Nord, `[INDUSTRIAL_1]` → Fanuc, `[INDUSTRIAL_2]` → Trumpf, `[INDUSTRIAL_3]` → Kapasiteten, `[INDUSTRIAL_4]` → enheter per skift, `[PERSON_1]` → Lars Eriksen, `[PHONE_1]` → 98765432

<a id="12-religious"></a>

## 12. Religious: pastoral care

Pastoral care and leaving the congregation, tied to a named person.

**Domain:** `religious`

**Paste:**

```text
Kari Hansen kom til sjelesorg i går og vil melde seg ut av menigheten. Hansen ba om forbønn for familien.
```

**Underlined (6):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Kari Hansen` | person_name | amber | `[PERSON_1]` |
| `sjelesorg` | religious | teal | `[RELIGIOUS_1]` |
| `melde seg ut` | religious | teal | `[RELIGIOUS_2]` |
| `menigheten` | religious | teal | `[RELIGIOUS_3]` |
| `Hansen` | person_name | amber | `[PERSON_1]` |
| `forbønn` | religious | teal | `[RELIGIOUS_4]` |

**After Hide all:**

```text
[PERSON_1] kom til [RELIGIOUS_1] i går og vil [RELIGIOUS_2] av [RELIGIOUS_3]. [PERSON_1] ba om [RELIGIOUS_4] for familien.
```

**Vault:** `[PERSON_1]` → Kari Hansen, `[RELIGIOUS_1]` → sjelesorg, `[RELIGIOUS_2]` → melde seg ut, `[RELIGIOUS_3]` → menigheten, `[RELIGIOUS_4]` → forbønn

<a id="13-own-words"></a>

## 13. Your own Domain

A Domain named Prosjekt with the words Nordlys and Fjell*. Fjell* also catches Fjellstasjonen.

**Domain:** `Prosjekt` with words `Nordlys`, `Fjell*`

**Paste:**

```text
Nordlys lanseres i mars. Fjellstasjonen får ny strøm, sier Anne Lie.
```

**Underlined (3):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Nordlys` | custom | teal | `[DATA_1]` |
| `Fjellstasjonen` | custom | teal | `[DATA_2]` |
| `Anne Lie` | person_name | amber | `[PERSON_1]` |

**After Hide all:**

```text
[DATA_1] lanseres i mars. [DATA_2] får ny strøm, sier [PERSON_1].
```

**Vault:** `[DATA_1]` → Nordlys, `[DATA_2]` → Fjellstasjonen, `[PERSON_1]` → Anne Lie

<a id="14-org-place"></a>

## 14. Organisation and place

GLiNER finds Statnett and Bergen. They hide as [DATA_n] for now (see the note in README).

**Domain:** `free`

**Paste:**

```text
Statnett bygger en ny transformatorstasjon i Bergen, sier Silje Haugen.
```

**Underlined (3):**

| Value | Category | Colour | Hides as |
|---|---|---|---|
| `Statnett` | organization | teal | `[DATA_1]` |
| `Bergen` | location | teal | `[DATA_2]` |
| `Silje Haugen` | person_name | amber | `[PERSON_1]` |

**After Hide all:**

```text
[DATA_1] bygger en ny transformatorstasjon i [DATA_2], sier [PERSON_1].
```

**Vault:** `[DATA_1]` → Statnett, `[DATA_2]` → Bergen, `[PERSON_1]` → Silje Haugen

<a id="15-neg-church"></a>

## 15. Negative: service time

Public church talk. Zero Findings.

**Domain:** `religious`

**Paste:**

```text
Gudstjenesten starter klokken 11 på søndag.
```

**Underlined:** nothing. No Ghost bar.

<a id="16-neg-class"></a>

## 16. Negative: class average

Class-level numbers are not about one student. Zero Findings.

**Domain:** `education`

**Paste:**

```text
Snittet i 10A var 4,1 på matteprøven.
```

**Underlined:** nothing. No Ghost bar.

<a id="17-neg-checksum"></a>

## 17. Negative: failed checksum

11 digits, but the fnr checksum fails. Zero Findings.

**Domain:** `free`

**Paste:**

```text
Ordrenummer 01019000084 er sendt.
```

**Underlined:** nothing. No Ghost bar.

<a id="18-neg-published"></a>

## 18. Negative: published decision

A Lovdata reference is public. Zero Findings.

**Domain:** `courts`

**Paste:**

```text
Se avgjørelsen HR-2023-1234-A om erstatning.
```

**Underlined:** nothing. No Ghost bar.

## Notes

- Organisations and places hide as `[DATA_n]`. The spec says `[ORG_n]` and `[PLACE_n]`, but the Engine's Category table doesn't have them yet. Update cases 07, 11 and 14 when it does.
- The Industrial Domain flags a machine maker on its own (`Siemens lanserte en ny PLS` gives 2 Findings), so it isn't used as a negative here.
- GLiNER results can shift with a new model. If a check fails after a model change, look at the case again before changing `cases.json`.
