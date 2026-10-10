import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from rank_bm25 import BM25Okapi

# 1. The AI model (reads GROQ_API_KEY from your environment)
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0.2)

# 2. Load the knowledge file, one chunk per paragraph
with open("bakery_info.txt", encoding="utf-8") as f:
    chunks = [c.strip() for c in f.read().split("\n\n") if c.strip()]


def tokenize(text):
    return [w[:4] for w in re.findall(r"\w+", text.lower())]


bm25 = BM25Okapi([tokenize(c) for c in chunks])


def retrieve(question, k=3):
    return bm25.get_top_n(tokenize(question), chunks, n=k)


# 3. The prompt
SYSTEM_PROMPT = (
    "You are a friendly assistant for Sunrise Bakery. Keep answers short. "
    "Answer ONLY using the business information below. If the answer is not "
    "in that information, say you're not sure and suggest the customer phone "
    "the bakery. Never invent prices, hours or policies.\n\n"
    "Business information:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder("history"),
    ("human", "{question}"),
])

# 4. Chain: prompt -> model -> plain text
chain = prompt | llm | StrOutputParser()

# 5. Chat loop
history = []

while True:
    question = input("You: ")
    found = retrieve(question)
    print("[debug] retrieved:", [c[:40] for c in found])  # delete once you trust it

    reply = chain.invoke({
        "context": "\n\n".join(found),
        "history": history,
        "question": question,
    })

    history.append(HumanMessage(content=question))
    history.append(AIMessage(content=reply))
    print("Bot:", reply)