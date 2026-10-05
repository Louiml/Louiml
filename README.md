<div align="center">

## Hey, I'm Louiml

</div>

<details>
  <summary><b>What's Rak?</b></summary>

<br>

**[Rak](https://github.com/Louiml/Rak)** is a general-purpose programming language built mainly for cybersecurity, OSINT and systems work. It's written in Rust and licensed under Apache-2.0.

- **Hex-first.** Hex is a first-class type, with a static type checker, generics, traits, pattern matching (including binary byte patterns), macros and closures.
- **Two backends.** There's a tree-walking interpreter and a bytecode VM that runs about 6x faster.
- **Forensic structs.** `binstruct` gives you a decoder and an encoder from one declaration. Decoded values carry `evidence<T>` provenance tags, so `report(...)` can produce chain-of-custody-cited findings.
- **Security stdlib.** It covers DNS/TLS/PCAP parsers, raw socket packet forging, WHOIS, certificate-transparency subdomain enumeration, a YARA-lite scanner, native crypto (AES-GCM, Ed25519, HMAC), memory-mapped files and FFI.
- **Self-contained.** It can build standalone executables and native GUI windows, and it ships a SQL server and a Rak interpreter, both written in Rak.
- **Tooling.** It has the `oyvey` package manager, an LSP, a DAP debugger, a formatter and linter, a REPL, a Tauri + Next.js IDE and a VS Code extension.

Latest: **v0.7.2** · Windows & Linux · [Repo](https://github.com/Louiml/Rak) · [Website](https://louiml.github.io/Rak/)

</details>

<details>
  <summary><b>What's Senlight AI?</b></summary>

<br>

**[Senlight AI](https://github.com/Louiml/SenlightAI)** is a research project on Artificial Emotional Intelligence (AEI): an LLM that tracks its own emotional state and reasons about moral context.

- **Affective attention.** A decoder-only transformer whose emotional state (VAD: valence, arousal, dominance, anchored to Plutchik's eight emotions) biases the attention logits directly. Emotion changes token probabilities at the arithmetic level instead of through prompt wording.
- **Intent router.** A dedicated crisis-detection head sits outside the main softmax. The model mirrors a user's own emotion but not third-party emotion, and not crisis.
- **Sycophancy harness.** An eval suite measures whether the model caves to false premises or pushes back.
- **Two planned models.**
  - **Senlight Elafry (8B):** on-device edge model for real-time affective dialogue.
  - **Senlight Varys (70B):** heavyweight model for deeper psychological analysis and moral reasoning.
- **Implementation.** The PyTorch training and eval stack has 305 tests. A Rust (candle) inference engine has cross-language parity checks against PyTorch.

> **Status:** early research. The architecture, training stages and tooling are implemented, but no model has been trained yet, so there is no checkpoint.

[Repo](https://github.com/Louiml/SenlightAI) · [Website](https://louiml.github.io/SenlightAI/)

</details>

<hr>

### What tools I use

<div align="center">
  <img src="https://skillicons.dev/icons?i=html,css,js,ts,python,cpp,c,rust,nodejs,react,nextjs,git,github,linux,docker,unreal&perline=6" alt="Skills">
</div>

<hr>

### Featured projects

<div align="center">
  <a href="https://github.com/Louiml/Rak">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=Louiml&repo=Rak&theme=tokyonight&hide_border=true" alt="Rak">
  </a>
  <a href="https://github.com/Louiml/SenlightAI">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=Louiml&repo=SenlightAI&theme=tokyonight&hide_border=true" alt="Senlight AI">
  </a>
</div>
<hr>
<div align="center"></a> <a href="https://github.com/Louiml"> <img height="180" src="https://github-readme-stats.vercel.app/api/top-langs/?username=Louiml&layout=compact&theme=tokyonight&hide_border=true" alt="Top languages"> </a> <img src="https://media1.tenor.com/m/P_6MIEMs8joAAAAd/counter-strike-counter-strike-2.gif" width="295" alt="CS2 meme"></div>

<br>

<div align="center">
  <a href="https://steamcommunity.com/id/xemoraz/">
    <img src="https://img.shields.io/badge/Add_me_on_Steam-Xemoraz-1b2838?style=for-the-badge&logo=steam&logoColor=white" alt="Add me on Steam">
  </a>
</div>
