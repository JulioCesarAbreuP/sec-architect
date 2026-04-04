import json
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys


SECTIONS = [
    ("01-header", "body"),
    ("02-parser", "#panel-json"),
    ("03-zero-trust", "#zeroTrustPanel"),
    ("04-threat-intel", "#threatIntelPanel"),
    ("05-architecture-board", "#architectureBoardPanel"),
]


def get_active_descriptor(driver):
    script = """
    const element = document.activeElement;
    if (!element) return { tag: 'none' };
    return {
      tag: (element.tagName || '').toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      text: (element.innerText || element.textContent || '').trim().slice(0, 120),
      ariaLabel: element.getAttribute('aria-label') || '',
      role: element.getAttribute('role') || '',
      ariaPressed: element.getAttribute('aria-pressed') || '',
      href: element.getAttribute('href') || ''
    };
    """
    return driver.execute_script(script)


def capture_focus_sequence(driver, steps=18):
    body = driver.find_element("css selector", "body")
    body.click()
    sequence = []
    actions = ActionChains(driver)
    for index in range(steps):
      actions.send_keys(Keys.TAB).perform()
      time.sleep(0.2)
      descriptor = get_active_descriptor(driver)
      descriptor["step"] = index + 1
      sequence.append(descriptor)
    return sequence


def capture_section_screens(driver, output_dir: Path):
    for name, selector in SECTIONS:
        driver.execute_script(
            "document.querySelector(arguments[0]).scrollIntoView({behavior:'instant',block:'start'});",
            selector,
        )
        time.sleep(0.4)
        driver.save_screenshot(str(output_dir / f"{name}.png"))


def build_driver(chrome_path: str):
    options = Options()
    options.binary_location = chrome_path
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1600,2200")
    options.add_argument("--force-renderer-accessibility")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    return webdriver.Chrome(options=options)


def run_pass(driver, label: str, url: str, output_root: Path):
    driver.get(url)
    time.sleep(2)

    record = {
        "label": label,
        "url": url,
        "title": driver.title,
        "focusSequence": capture_focus_sequence(driver),
    }

    if label == "after":
        screens_dir = output_root / "screens"
        screens_dir.mkdir(parents=True, exist_ok=True)
        capture_section_screens(driver, screens_dir)
        record["screenshots"] = sorted(path.name for path in screens_dir.glob("*.png"))

    return record


def main():
    if len(sys.argv) != 5:
        raise SystemExit("Usage: enterprise_accessibility_pass.py <chrome_path> <before_url> <after_url> <output_dir>")

    chrome_path, before_url, after_url, output_dir = sys.argv[1:]
    output_root = Path(output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    driver = build_driver(chrome_path)
    try:
        before_record = run_pass(driver, "before", before_url, output_root)
        after_record = run_pass(driver, "after", after_url, output_root)
    finally:
        driver.quit()

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "before": before_record,
        "after": after_record,
    }
    (output_root / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()