# Chesed App — Product Brief
*For developer/designer collaborators*

---

## What This Is

A mobile-first app that connects people who need small favors with nearby people who can help — no money, no exchange, just community generosity. Think of it as the infrastructure layer beneath the informal help-request culture that already exists in neighborhood WhatsApp and Facebook groups, but with smart matching, structured requests, and a reputation system that actually motivates givers.

The name comes from the Hebrew word *chesed* (חֶסֶד) — typically translated as "loving-kindness" or "acts of generosity." It's a value deeply embedded in Jewish culture, but the app itself is not religion-specific; anyone can use it. The initial launch will be in Israel, where this culture is particularly strong and community WhatsApp groups are already the de facto infrastructure for this kind of mutual aid.

---

## The Problem It Solves

In tight-knit communities, people constantly help each other — rides to medical appointments, a meal for a family with a new baby, someone to pick up a prescription, help moving furniture. Right now this happens through WhatsApp group broadcasts: someone posts a need to a group of hundreds, a few people respond, and it works — but barely. The experience is noisy, hard to search, geography-blind, and depends entirely on whoever happens to be watching at the right moment.

The app replaces the broadcast with a match. Requesters describe what they need; helpers describe what they're willing to offer. The app surfaces relevant, nearby matches and handles the coordination.

---

## Core Metaphor

**Riders and Drivers** — borrowed from Uber, intentionally. Requesters ("riders") post needs. Helpers ("drivers") indicate what they're available for and get notified of nearby requests that fit. Unlike Uber, there is no payment, no obligation, and no real-time pressure. Timing is flexible: some requests are urgent ("I need a ride in an hour"), many are not ("I need someone to help me move a couch next Thursday").

---

## Key Features

### 1. Structured Request Types
Rather than free-text requests, the app uses a closed taxonomy of favor categories. This keeps the matching problem tractable and prevents scope creep. The taxonomy has two levels: **clusters** (broad categories, used to tag helper profiles) and **leaf nodes** (specific request types, used when posting a need).

#### Clusters and Leaf Nodes

**🚗 Mobility**
- Ride to a medical appointment
- Ride to a government office (misrad, court, etc.)
- Airport or train station drop-off / pickup
- Ride to a simcha or event
- Help arranging transport for an elderly or disabled person

**📦 Errands & Logistics**
- Pick up a prescription from the pharmacy
- Grab one or two items from the supermarket
- Wait at home for a delivery or technician
- Drop something off on the way somewhere
- Help navigate a government or bureaucratic process (e.g., accompanying someone to misrad hapnim)

**🍲 Food**
- Deliver a shiva meal
- Bring dinner to a family with a new baby
- Drop off Shabbat food to someone who can't cook
- Help with food pickup / distribution for a local organization
- Deliver a meal to someone who is sick or recovering

**🛠️ Borrow / Lend**
- Lend folding tables or chairs (for a simcha or event)
- Lend a tool (drill, ladder, wheelbarrow, etc.)
- Lend baby or child gear (pack-n-play, stroller, high chair)
- Lend kitchen equipment (large pot, mixer, serving trays)
- Lend a suitcase or travel item

**👶 Care**
- Watch my kids for a couple of hours
- Pick up my child from school or an activity
- Sit with an elderly or unwell person for a few hours
- Pet care / dog walking while I'm away
- Help with miluim support — childcare or presence for a family whose partner is on reserve duty *(Israel-specific)*

**💪 Muscle**
- Help carry boxes or furniture
- Help with an apartment move (a few hours, not a full moving service)
- Help assemble flat-pack furniture
- Help with yard work or clearing a space
- Help carry something heavy up or down stairs

**🫂 Presence**
- Accompany someone to a difficult medical appointment
- Make a check-in call to an isolated or elderly neighbor
- Shiva visit (help coordinate or simply show up)
- Sit with someone who is going through a hard time
- Help a new oleh navigate an unfamiliar situation

**🔧 Practical Skills**
- Basic tech help (phone, computer, printer, router)
- Minor home repair (a leaking tap, a stuck drawer, a broken hinge)
- Tutoring or homework help for a child
- Translation help (Hebrew ↔ English or other languages)
- Help writing or proofreading a letter or form

---

Each cluster has a small number of specific leaf-node request types (aiming for ~30–40 total across all clusters). Requesters pick from a list; they don't write free text for the core need (though they can add a short note).

### 2. Location Awareness
The app is GPS-enabled. Helpers set a radius they're willing to operate within. Requests are only surfaced to helpers for whom the request is geographically relevant. Matching is cluster-level (a "Mobility" helper sees all mobility requests nearby), so helpers don't need to enumerate every possible sub-type.

### 3. Timing Modes
Two request modes:
- **Now** — time-sensitive, needs a response within hours
- **Scheduled** — request is for a specific future date/time, helpers can commit in advance

This is a meaningful distinction from Uber: much of the value is in the *non-urgent* scheduled queue, which is easier to fill and less stressful for everyone.

### 4. Helper Profiles
Helpers create a simple profile indicating:
- Which clusters they're willing to help with
- Availability windows (rough: weekdays, weekends, mornings, evenings)
- Any specific assets they have (e.g., "I have a large car," "I have a baby gate I can lend")
- Their neighborhood / operating radius

No skills certification, no vetting beyond account creation. Trust is handled socially (see Reputation System below).

### 5. Reputation System
This is the heart of the app's retention and motivation loop, and it deserves serious design attention. Some principles:

- **Givers** accumulate a visible record of help given — not a points total, but a *story*. Something like "Moshe has given 23 rides, delivered 8 meals, and helped 4 families move." This is the social currency.
- **Recognition is public and specific** — recipients can leave a short note of thanks that appears on the helper's profile. The goal is to make helpers feel genuinely *known*, not just scored.
- **No gamification for its own sake** — no leaderboards, no badges that feel arbitrary. The reputation system should feel like a community memory, not a game.
- **Requesters have accountability too** — a history of requests and whether they were fulfilled creates a soft social norm against overuse.

---

## What the App Is Not

- **Not a marketplace.** No money changes hands. No tipping, no paid tiers for helpers.
- **Not a gig platform.** Helpers are not contractors; they're community members. The relationship is peer-to-peer, not client-to-service-provider.
- **Not a volunteer management system.** There's no organization coordinating the help. It's fully decentralized.
- **Not a social network.** The feed is not a timeline. The app is transactional in the good sense: it exists to get specific things done.
- **Not open to professional or commercial requests.** You can't post "I need a plumber" and expect a pro to show up. You can post "I need someone to help me figure out why my sink is draining slowly."

---

## Constraints That Bound the Problem

These are design principles, not just nice-to-haves. They matter for keeping the app compact and safe:

1. **Time-limited favors only** — requests are for episodic help, not ongoing commitments.
2. **No professional licensing required** — nothing that requires a medical, legal, or financial credential.
3. **In-person or local** — all help requires physical proximity (not remote freelancing).
4. **No monetary exchange** — the gift economy is the product.

---

## Initial Market

**Israel, at launch.** The culture of mutual aid through WhatsApp groups is particularly strong here — almost every neighborhood, yishuv, and community has multiple active help groups. The app is designed to work across religious and secular communities; no features are religion-specific, though the chesed framing will resonate most strongly in communities where the concept is culturally familiar.

A specific Israel-relevant category worth calling out: support for families of reservists (*miluim* support) — childcare, errands, emotional support for the at-home partner while a spouse is doing reserve duty. This is a recurring, real need in Israel that a locally-aware product can serve well.

---

## Technical Considerations

*(To be elaborated in a separate technical spec, but surfacing here for context)*

- Mobile-first; likely React Native or Flutter for cross-platform iOS/Android
- Real-time or near-real-time notification system (push notifications are critical for "Now" requests)
- Location services with privacy controls (helpers should be able to set an operating area without exposing their exact home address)
- Lightweight backend: the data model is relatively simple — users, requests, commitments, and reputation records
- Hebrew and English UI from day one; the app should feel native in both languages (RTL support required)
- Account creation needs enough friction to prevent abuse, but not so much that it kills adoption — phone number verification is probably the right level

---

## Open Design Questions

These are things we haven't resolved yet and will need your input on:

1. **Discovery flow** — how does a helper find requests? Push notifications only, or also an active browsable feed? What's the right balance?
2. **Commitment UX** — once a helper says "I'll do this," what happens? How do we handle no-shows gracefully without creating punitive systems?
3. **Request expiry** — what happens to a request nobody picks up? Does the requester get notified? Can they re-broadcast?
4. **The lend/borrow cluster** — this is somewhat different in nature from the others (it involves objects, not just time). Does it belong in the same app, or is it a separate feature mode?
5. **Onboarding** — how do we get both sides of the market simultaneously in a new geography? The cold-start problem is real.

---

## The One-Sentence Version

*A location-aware app that turns "does anyone have time to help me with X?" from a WhatsApp broadcast into a quiet, dignified match between someone who needs a small favor and someone nearby who can give it.*

---

*Document prepared March 2026. Work in progress — feedback welcome.*