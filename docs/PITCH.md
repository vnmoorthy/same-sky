# Same Sky — three-minute pitch storyboard

## Pitch objective

Make one judge physically complete the return pulse. The product’s emotional
proof is not a slide or architecture claim; it is the silent eight seconds when
the judge’s screen and the festival phone become the same light.

Preferred setup: two phones, already on the landing screen. Reliable fallback:
**Run the one-screen judge demo**, which uses two private clients against the
real backend without camera or microphone permissions.

## Storyboard

| Time | Screen/action | Presenter words |
|---|---|---|
| **0:00–0:12** | Hold on the Same Sky landing promise. | **“A livestream lets you watch Outside Lands. Same Sky lets someone there make you feel there.”** |
| **0:12–0:30** | Show the official-stream viewer on one phone and the festival role on the other. | “Remote fans get perfect video and sound, but none of the small physical facts that make a festival feel real—the cold air after a song, bass in your chest, one person thinking of you from the field.” |
| **0:30–0:47** | HERE creates a bridge; FAR AWAY joins with the code. Both show paired state. | “Same Sky opens one private bridge between one attendee and one viewer. No account, no public room, no feed.” |
| **0:47–1:09** | HERE chooses the set. Show the rights-safe sample, the observation, `Cool wind`, `Bass in my chest`, and the ambient estimate. Press **Make the postcard**. | “The person onsite captures one image and reports what the camera cannot know. Ambient audio never leaves the browser—we keep only a rough intensity estimate.” |
| **1:09–1:31** | Generation resolves to the postcard. Point briefly to OpenAI/fallback provenance and alt text. | “OpenAI turns only those firsthand signals into restrained, accessible language. Strict structured output forbids identifying faces, invented feelings, lyrics, weather, or fake artist endorsement. If the API fails, a deterministic generator keeps the ritual alive.” |
| **1:31–1:43** | HERE presses **Approve & send**. | “And AI never gets the final word. Nothing crosses until the sender reviews and approves every sentence.” |
| **1:43–2:01** | FAR AWAY receives the postcard without refresh. Give the judge time to read. | “Now this is not generic festival content. It is one specific human moment, from the field, right now.” |
| **2:01–2:10** | Hand FAR AWAY to the judge; point to **Hold to send a pulse**. | “Would you hold that button?” |
| **2:10–2:20** | Judge completes the hold. Both clients enter the synchronized pulse. | Say only: “That sends one signal back.” |
| **2:20–2:28** | Both screens glow; HERE vibrates; closing line appears. | **Say nothing for all eight seconds.** Let `For eight seconds, you were under the same sky.` land. |
| **2:28–2:43** | Show completion, the anonymous shared-sky bloom, and expiry/delete controls. | “No likes. No comments. No follower count. That one reciprocal signal was enough—and it leaves only an anonymous mark on today’s shared sky. Either person can delete immediately, and the entire bridge disappears within 24 hours.” |
| **2:43–2:55** | Brief architecture view or spoken stack; do not leave the product for long. | “OpenAI creates the accessible postcard. JamBase adds confirmed artist context. ChatGPT Sites hosts the experience; D1 and R2 hold the expiring state and resized private image. Every dependency has a demo-safe fallback.” |
| **2:55–3:00** | Return to the shared-sky completion screen. | **“Outside Lands already brings the show everywhere. Same Sky brings one person into the feeling of being there.”** |

## Three claims to emphasize in Q&A

### Why this makes the festival better

The official livestream solves access to the performance. Same Sky adds the
missing social and sensory layer without competing with the broadcast: one
onsite fan makes one remote viewer feel physically included.

### Why this creates superfans

Superfandom grows from remembered personal moments, not another recommendation
feed. Artist/set context anchors the ritual to a specific performance; the
viewer participates by returning a pulse instead of consuming passively.

### Why the product is intentionally small

Feeds, profiles, chat, and reaction counts would turn intimacy back into content
and metrics. The constraints—one recipient, one postcard, one pulse, automatic
expiry—are the product, not missing roadmap items.

## Likely judge questions

**“Is this just an AI postcard?”**  
No. Generation is one governed step inside a synchronous two-person state
machine. The differentiating interaction is approval, private delivery, and the
single synchronized return pulse. The deterministic fallback proves the ritual
does not depend on AI spectacle.

**“Why not send a photo or text message?”**  
Those are asynchronous content objects inside noisy apps. Same Sky creates a
bounded ritual: live set context, accessible sensory translation, a single
recipient, reciprocal physical feedback, shared timing, and automatic deletion.

**“How do you prevent hallucination?”**  
Inputs are bounded; the model receives literal firsthand facts and an optional
low-detail image; output follows strict JSON Schema; the prompt forbids
unsupported inference; fields are validated and length-limited; and the onsite
human must approve before publication.

**“What happens on bad festival connectivity?”**  
Clients poll a tiny D1 record, recover on the next interval, and synchronize
from server timestamps. JamBase and OpenAI have local fallbacks, camera and
microphone are optional, and judge mode includes a rights-safe sample.

**“What is stored?”**  
An expiring D1 session, bounded descriptors, the approved postcard, pulse
timestamps, and—if supplied—a resized private R2 image. No account, GPS, raw
audio, social graph, or original-resolution photo. Either participant can erase
the bridge immediately; otherwise it expires within 24 hours.

## Demo discipline

- Put the pulse device in a judge’s hand before the two-minute mark.
- Do not explain over the eight-second sequence.
- Do not open source code during the main story; architecture belongs in Q&A.
- Keep a reset judge-demo tab ready.
- If live OpenAI falls back, say so plainly; the provenance is a strength.
- Never show identifiable strangers, copyrighted performance footage, lyrics,
  or recorded festival audio.

## Source-safe claims and attribution

- Event/category context: [OutsideLLMS official site](https://outsidellms.com/)
  and [OutsideLLMS III on Luma](https://luma.com/OutsideLLMS3).
- Livestream context: [official Outside Lands livestream on Prime Video](https://www.primevideo.com/detail/0FFYUNMY3OBBG8WGDH9O8IY7UO).
- Artist enrichment: [JamBase API quickstart](https://data.jambase.com/api/docs/getting-started)
  and [attribution requirements](https://data.jambase.com/api/docs/attribution).
- Generation contract: [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses/create)
  and [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs).

Do not claim an unpublished judging rubric, guaranteed livestream integration,
festival endorsement, or required use of every sponsor tool. Same Sky is an
independent prototype designed to complement the official livestream.
