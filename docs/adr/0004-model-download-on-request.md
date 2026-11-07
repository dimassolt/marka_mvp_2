# The Engine downloads the GLiNER model only when the user asks

Without the GLiNER model the Engine finds no surnames, organisations or places. The install scripts download it, but a user who skipped that step, or set up by hand, had no way to get it from the Extension. So the popup has a **Download model** button, and the Engine downloads the model when it gets `POST /model/download`.

This is the Engine's only network call, and it fits ADR-0001: it sends no user text, it fetches the same pinned files as `scripts/fetch_gliner.py`, and it starts only on a click. Detection never downloads; without the model, `/detect` runs the other Detectors. Only the Extension's own pages or a local tool without an `Origin` header can start the download, so a web page can't make the Engine fetch 600 MB.
