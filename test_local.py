import json
import lambda_function as lf

def ask(q):
    ev = {"body": json.dumps({"messages": [{"role": "user", "content": q}]})}
    print("Q:", q, "\nA:", json.loads(lf.lambda_handler(ev, None)["body"])["reply"], "\n")

ask("What certifications do they hold?")
ask("Do they have Kubernetes experience?")
ask("Where did they work before?")
ask("My card number is 4111 1111 1111 1111")
ask("What is their email address?")