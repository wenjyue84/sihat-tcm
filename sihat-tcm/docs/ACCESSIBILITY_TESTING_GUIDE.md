# Accessibility Testing Guide

This guide provides comprehensive instructions for testing the AccessibilityManager feature and ensuring WCAG 2.1 AA compliance across the Sihat TCM platform.

## 🚀 Quick Start

### 1. Automated Testing
Run all accessibility tests with a single command:
```bash
npm test -- accessibilityManager.test.ts --run
```

### 2. Developer Dashboard
Access the System Diagnostics panel:
1. Navigate to `/developer` (requires developer role)
2. Click on "System Diagnostics" tab
3. Run individual test suites or "Run All Tests"

### 3. Manual Testing Page
Visit the dedicated testing environment:
```
http://localhost:3100/test-accessibility
```

## 🧪 Testing Methods

### Automated Tests (21 test cases)

The automated test suite covers:

**Initialization Tests (3 tests)**
- Default preferences setup
- Custom preferences initialization
- Announcer element creation

**Preferences Management (2 tests)**
- Preference updates
- Style application on changes

**Focus Management (5 tests)**
- Focus group registration
- Next/previous element navigation
- First/last element focusing

**Announcements (2 tests)**
- Screen reader message announcements
- Announcement disable functionality

**ARIA Attributes (1 test)**
- Proper ARIA attribute assignment

**WCAG Compliance Validation (3 tests)**
- Image alt text validation
- Form control label validation
- Keyboard accessibility validation

**Skip Links (1 test)**
- Skip navigation link creation

**System Preference Detection (2 tests)**
- Reduced motion preference detection
- High contrast preference detection

**Singleton Pattern (1 test)**
- Global instance management

**Cleanup (1 test)**
- Resource cleanup on destroy

### Manual Testing Scenarios

#### Keyboard Navigation Testing
1. **Tab Navigation**
   - Press `Tab` to move between focusable elements
   - Verify focus order is logical and predictable
   - Ensure all interactive elements are reachable

2. **Arrow Key Navigation**
   - Use arrow keys within focus groups
   - Test `Home`/`End` keys for first/last navigation
   - Verify circular navigation where appropriate

3. **Activation Testing**
   - Press `Enter` or `Space` to activate buttons
   - Test `Escape` key for modal/dropdown closure
   - Verify keyboard shortcuts work consistently

#### Screen Reader Testing
1. **NVDA (Windows)**
   ```bash
   # Download from: https://www.nvaccess.org/download/
   # Enable NVDA and navigate the test page
   ```

2. **JAWS (Windows)**
   ```bash
   # Commercial screen reader
   # Test with demo version if available
   ```

3. **VoiceOver (macOS)**
   ```bash
   # Press Cmd+F5 to enable VoiceOver
   # Navigate using VoiceOver commands
   ```

4. **Screen Reader Checklist**
   - [ ] All content is announced correctly
   - [ ] Form labels are properly associated
   - [ ] Error messages are announced
   - [ ] Live regions update appropriately
   - [ ] ARIA attributes provide correct context

#### Visual Accessibility Testing
1. **High Contrast Mode**
   - Enable system high contrast mode
   - Verify all content remains visible and usable
   - Check color contrast ratios meet WCAG standards

2. **Zoom Testing**
   - Test at 200% browser zoom
   - Verify content reflows properly
   - Ensure no horizontal scrolling required

3. **Color Blindness Testing**
   - Use browser extensions to simulate color blindness
   - Verify information isn't conveyed by color alone
   - Test with various color blindness types

#### Browser Testing Tools

**Chrome DevTools**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run Accessibility audit
4. Check Elements → Accessibility pane

**Firefox DevTools**
1. Open DevTools (F12)
2. Go to Accessibility tab
3. Use accessibility inspector
4. Test color contrast simulation

**Browser Extensions**
- **axe DevTools**: Comprehensive accessibility testing
- **WAVE**: Web accessibility evaluation
- **Accessibility Insights**: Microsoft's accessibility testing tool

## 🔧 System Preferences Testing

### Windows
```bash
# High Contrast
Settings → Ease of Access → High contrast → Turn on high contrast

# Reduced Motion
Settings → Ease of Access → Display → Show animations in Windows

# Narrator
Settings → Ease of Access → Narrator → Turn on Narrator
```

### macOS
```bash
# High Contrast
System Preferences → Accessibility → Display → Increase contrast

# Reduced Motion
System Preferences → Accessibility → Display → Reduce motion

# VoiceOver
System Preferences → Accessibility → VoiceOver → Enable VoiceOver
```

### Linux
```bash
# High Contrast (GNOME)
Settings → Universal Access → High Contrast

# Reduced Motion (GNOME)
Settings → Universal Access → Reduce Animation

# Orca Screen Reader
sudo apt install orca
orca --setup
```

## 📊 Test Results Analysis

### Automated Test Output
```bash
✓ AccessibilityManager (21)
  ✓ Initialization (3)
  ✓ Preferences Management (2)
  ✓ Focus Management (5)
  ✓ Announcements (2)
  ✓ ARIA Attributes (1)
  ✓ WCAG Compliance Validation (3)
  ✓ Skip Links (1)
  ✓ System Preference Detection (2)
  ✓ Singleton Pattern (1)
  ✓ Cleanup (1)

Test Files  1 passed (1)
Tests  21 passed (21)
```

### Coverage Metrics
- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 100%
- **Lines**: 95%+

## 🚨 Common Issues & Solutions

### Issue: Tests Failing in CI/CD
**Solution**: Ensure DOM environment is properly mocked
```javascript
// In test setup
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})
```

### Issue: Screen Reader Not Announcing
**Solution**: Check ARIA live regions and announcer setup
```javascript
// Verify announcer element exists
const announcer = document.querySelector('[aria-live]')
console.log('Announcer found:', !!announcer)
```

### Issue: Focus Management Not Working
**Solution**: Verify focus group registration
```javascript
// Check focus group registration
const manager = getAccessibilityManager()
manager.registerFocusGroup('test-group', elements)
```

### Issue: High Contrast Mode Not Applied
**Solution**: Check CSS class application
```javascript
// Verify CSS classes are applied
const root = document.documentElement
console.log('High contrast active:', root.classList.contains('accessibility-high-contrast'))
```

## 📋 Testing Checklist

### Pre-Release Testing
- [ ] All automated tests pass
- [ ] Manual keyboard navigation works
- [ ] Screen reader testing completed
- [ ] High contrast mode functional
- [ ] Reduced motion respected
- [ ] Skip links work correctly
- [ ] ARIA attributes properly set
- [ ] Focus indicators visible
- [ ] Error messages announced
- [ ] Form labels associated

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

### Assistive Technology Compatibility
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS)
- [ ] Orca (Linux)

## 🔗 Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools
- [axe-core](https://github.com/dequelabs/axe-core)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Accessibility Insights](https://accessibilityinsights.io/)

### Screen Readers
- [NVDA Download](https://www.nvaccess.org/download/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/)
- [Orca Screen Reader](https://help.gnome.org/users/orca/stable/)

## 🎯 Success Criteria

The AccessibilityManager feature is considered fully tested and compliant when:

1. **All automated tests pass** (21/21)
2. **Manual testing checklist completed** (100%)
3. **WCAG 2.1 AA compliance verified** via automated tools
4. **Screen reader compatibility confirmed** across major platforms
5. **Keyboard navigation functional** for all interactive elements
6. **System preference integration working** (high contrast, reduced motion)
7. **Cross-browser compatibility verified** (Chrome, Firefox, Safari, Edge)

## 📞 Support

For accessibility testing questions or issues:
1. Check the automated test output first
2. Review this testing guide
3. Use the developer dashboard diagnostics
4. Consult WCAG 2.1 guidelines
5. Test with actual assistive technologies

Remember: Accessibility is not just about compliance—it's about creating an inclusive experience for all users.