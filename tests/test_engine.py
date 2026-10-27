"""Behavior and Python/browser parity checks for the prototype decision model."""

from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from engine import calculate, evaluate  # noqa: E402
from server import DIST, PortalHandler  # noqa: E402


class CreditEngineTests(unittest.TestCase):
    def test_fixed_interest_and_service_fee(self):
        self.assertEqual(calculate(), {
            "principal": 50000, "interest": 3000, "total": 53000,
            "monthlyPayment": 4416.67, "fee": 500, "netProceeds": 49500,
        })

    def test_annuity_and_zero_interest(self):
        diminishing = calculate({"method": "diminishing"})
        self.assertEqual(diminishing["monthlyPayment"], 4303.32)
        self.assertLess(diminishing["interest"], calculate()["interest"])
        zero_rate = calculate({"method": "diminishing", "annualRate": 0})
        self.assertEqual(zero_rate["interest"], 0)
        self.assertEqual(zero_rate["monthlyPayment"], 4166.67)

    def test_favorable_and_adverse_cases(self):
        favorable = evaluate({"income": 100000, "liabilities": 0, "savings": 100000,
                              "repayment": 100, "comakerIncome": 100000, "comakerLiabilities": 0})
        adverse = evaluate({"income": 5000, "liabilities": 5000, "savings": 0,
                            "repayment": 20, "comakerIncome": 5000, "comakerLiabilities": 5000})
        self.assertEqual((favorable["score"], favorable["recommendation"]), (95, "Recommended"))
        self.assertEqual((adverse["score"], adverse["recommendation"]), (10, "Not recommended"))
        for result in (favorable, adverse, evaluate()):
            self.assertEqual(len(result["rules"]), 12)
            self.assertAlmostEqual(sum(result["beliefs"].values()), 1)
            self.assertAlmostEqual(sum(rule["activation"] for rule in result["rules"]), 1)
            self.assertEqual(result["rules"], sorted(result["rules"], key=lambda rule: -rule["activation"]))

    def test_middle_anchors_need_review(self):
        # A zero-interest P12,000 loan gives P1,000 monthly; each criterion is
        # exactly at its middle anchor (40%, 40%, 75%, 40%).
        result = evaluate({"amount": 12000, "annualRate": 0, "income": 5000,
                           "liabilities": 1000, "savings": 4800, "repayment": 75,
                           "comakerIncome": 5000, "comakerLiabilities": 1000})
        self.assertEqual(result["score"], 55)
        self.assertEqual(result["recommendation"], "Needs review")
        self.assertAlmostEqual(result["beliefs"]["review"], .7)

    def test_reject_invalid_values(self):
        for payload in ([], "bad", {"amount": 0}, {"term": 1.5}, {"term": 0},
                        {"income": 0}, {"repayment": 101}, {"savings": -1},
                        {"method": "unknown"}, {"annualRate": float("nan")},
                        {"amount": True}, {"income": ""}, {"liabilities": None}):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                evaluate(payload)

    @unittest.skipUnless(shutil.which("node"), "Node.js is optional; skipped browser parity check")
    def test_javascript_python_parity(self):
        samples = [{}, {"method": "diminishing"}, {"annualRate": 0, "method": "diminishing"},
                   {"amount": 85000, "income": 17000, "liabilities": 4500, "repayment": 63,
                    "savings": 20000, "comakerIncome": 12000, "term": 24},
                   {"amount": "12000", "annualRate": 0, "income": 5000, "liabilities": 1000,
                    "savings": 4800, "repayment": 75, "comakerIncome": 5000, "comakerLiabilities": 1000}]
        source = (ROOT / "dist" / "engine.js").read_text()
        script = "const m = await import('data:text/javascript;base64,' + Buffer.from(" + json.dumps(source) + ").toString('base64')); console.log(JSON.stringify(" + json.dumps(samples) + ".map(m.evaluate)));"
        output = subprocess.check_output(["node", "--input-type=module", "-e", script], text=True)
        actual = json.loads(output)
        for sample, browser in zip(samples, actual):
            python = evaluate(sample)
            self.assertEqual(python["score"], browser["score"])
            self.assertEqual(python["recommendation"], browser["recommendation"])
            self.assertEqual(python["calculation"], browser["calculation"])
            for key in python["beliefs"]:
                self.assertAlmostEqual(python["beliefs"][key], browser["beliefs"][key], places=12)


class APITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(PortalHandler, directory=str(DIST)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_health_and_evaluate(self):
        with urlopen(self.base + "/api/health") as response:
            self.assertEqual(json.load(response)["status"], "ok")
        request = Request(self.base + "/api/evaluate", data=b"{}", headers={"Content-Type": "application/json"})
        with urlopen(request) as response:
            self.assertEqual(json.load(response), evaluate())

    def test_invalid_request_returns_json_error(self):
        cases = [(b'{"income":0}', "application/json", 400), (b"{oops", "application/json", 400),
                 (b"[]", "application/json", 400), (b"null", "application/json", 400),
                 (b"{}", "text/plain", 415)]
        for body, content_type, status in cases:
            request = Request(self.base + "/api/evaluate", data=body, headers={"Content-Type": content_type})
            with self.subTest(body=body), self.assertRaises(HTTPError) as failure:
                urlopen(request)
            self.assertEqual(failure.exception.code, status)
            self.assertIn("error", json.load(failure.exception))
            failure.exception.close()


if __name__ == "__main__":
    unittest.main()
