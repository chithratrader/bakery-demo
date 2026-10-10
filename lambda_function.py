import json
import re
import os

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from rank_bm25 import BM25Okapi

# This part runs once when Lambda starts, not on every message
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0.2, reasoning_effort="low")  # reads GROQ_API_KEY

kb_path = os.path.join(os.path.dirname(__file__), "bakery_info.txt")
with open(kb_path, encoding="utf-8") as f:
    chunks = [c.strip() for c in f.read().split("\n\n") if c.strip()]


def tokenize(text):
    return [w[:4] for w in re.findall(r"\w+", text.lower())]


bm25 = BM25Okapi([tokenize(c) for c in chunks])


def retrieve(question, k=3):
    return bm25.get_top_n(tokenize(question), chunks, n=k)


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
chain = prompt | llm | StrOutputParser()


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    msgs = body.get("messages", [])[-10:]
    if not msgs:
        return {"statusCode": 400, "body": json.dumps({"reply": "No message received."})}

    question = msgs[-1]["content"]
    history = [
        HumanMessage(content=m["content"]) if m["role"] == "user"
        else AIMessage(content=m["content"])
        for m in msgs[:-1]
    ]

    facts = "\n\n".join(retrieve(question))
    reply = chain.invoke({"context": facts, "history": history, "question": question})
    return {"statusCode": 200, "body": json.dumps({"reply": reply})}