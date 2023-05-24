<div align="left">
  <h1> Hey! I'm a programmer</h1>
  <h3> My favorite programming languages are:</h3>
  <img src="https://skillicons.dev/icons?i=java,c,cpp,cs,js,ts,assembly&theme=dark" height="50"><img align="left" height="50" src="https://cdn.hackr.io/uploads/topics_svg/1515163329FBBk5SGRAt.svg">
</div>
<div align="left">
<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Louiml&langs_count=11&theme=dark">
  
# Working on:
  
## QHU-GPT (Quick Human Understanding - Generative Pretrained Transformer)
QHU-GPT is a language model that combines QHU (Quick Human Understanding) technology with GPT (Generative Pretrained Transformer) to process and generate text based on user requests.
### Request Processing Workflow
The following Mermaid code illustrates the workflow of QHU-GPT:
```mermaid
graph LR
A[User Request] --> B(QHU Technology)
B --> C[QHU Text]
C --> D(GPT Model)
D --> E[Final Text Generation]
E --> F[Response to User]
```
```mermaid
sequenceDiagram
    participant User
    participant QHU as QHU Technology
    participant GPT as GPT Model
    User->>QHU: Send Request
    QHU-->>GPT: Convert to QHU Text
    GPT-->>GPT: Process QHU Text
    GPT-->>GPT: Generate Final Text
    GPT-->>User: Send Response
```
### Processing Time
The processing time for the entire QHU-GPT process usually ranges from 5 to 60 seconds, depending on the complexity of the request and the length of the generated response.
In this consolidated format, both Mermaid codes are included in a single piece of code. The first code presents a flowchart representation of the process, while the second code illustrates the sequence of interactions between the user, QHU technology, and the GPT model. The processing time information is also provided at the end. I apologize for any confusion caused earlier and I hope this meets your requirements.
### How QHU reads the text?
```mermaid
erDiagram
    REQUEST ||--o{ HOST : API-Starting
    HOST ||--|{ QHU : Explanation-By-Code
    REQUEST }|..|{ Pre-Response: Use-QHU-To-Read-The-Request
    Checking-For-Mistakes||--|{ Pre-Response : GPT
    Send-To-GPT-API||--|{ Checking-For-Mistakes: Out-of-GPT
    Send-To-GPT-API }|..|{ RESPONSE: Back-of-GPT
    RESPONSE ||--o{ Send-Response-To-ChatAPI: Recheck
```

</div>
