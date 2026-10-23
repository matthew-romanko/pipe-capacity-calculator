"""Browser smoke test of the actual generated classic-script bundle."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280,'height':900}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    # Navigation is administratively disabled in some sandboxes, so inject the
    # unmodified built script into HTML (not rewritten ES modules).
    html = (root/'index.html').read_text().replace('<script defer src="./dist/app.js"></script>', '')
    page.set_content(html)
    page.add_style_tag(content=(root/'css/styles.css').read_text())
    page.add_script_tag(content=(root/'dist/app.js').read_text())
    page.locator('#pipe-material option').first.wait_for(state='attached')
    assert page.locator('#pipe-material option').count() == 5, 'material dropdown not populated'
    assert page.locator('#pipe-size option').count() == 15, 'size dropdown not populated'
    assert page.locator('#pipe-material').input_value() == 'Single wall CPT'
    assert page.locator('#pipe-size').input_value() == '10'
    assert page.locator('#capacity').inner_text() == '0.5298'
    assert page.locator('#drainage-us-rows tr').count() == 6
    assert page.locator('#metric-rows tr').count() == 12
    assert page.locator('#pipe-comparison-rows tr').count() == 7
    page.screenshot(path=str(root/'desktop-preview.png'), full_page=True)
    page.locator('#pipe-material').select_option(label='PVC')
    page.locator('#pipe-size').select_option('12')
    page.locator('#slope').fill('0.25')
    assert page.locator('#capacity').inner_text() != '0.5298'
    page.locator('#area-acres').fill('50')
    assert page.locator('#drainage-us-rows tr').nth(0).locator('td').nth(2).inner_text() == '0.7878'
    page.locator('#slope').fill('-1')
    assert page.locator('#validation-error').is_visible()
    page.locator('#slope').fill('0.1')
    assert not page.locator('#validation-error').is_visible()
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(root/'mobile-preview.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth') <= 390
    assert not errors, f'JavaScript errors: {errors}'
    print('PASS bundled-script browser smoke test: 5 material choices, 15 sizes, updates, validation, mobile')
    browser.close()
