# Contributing to Hugo GPX Module

Thank you for your interest in contributing to the Hugo GPX Module! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/ravelzh/hugo-gpx-module.git
cd hugo-gpx-module

# Create a test Hugo site
hugo new site test-site
cd test-site
hugo mod init test-site
hugo mod get https://github.com/ravelzh/hugo-gpx-module.git

# Add a test GPX file
echo "<!-- Test -->" > static/test.gpx
```

## Code Style

- Keep code clean and well-commented
- Use meaningful variable and function names
- Follow Hugo templating best practices
- Test on multiple Hugo versions if possible

## Testing

Before submitting a pull request:

1. Test the module with different GPX files
2. Verify responsive design on mobile
3. Check for JavaScript errors in browser console
4. Test with both light and dark themes

## Submission Guidelines

### Pull Request Process

1. Update README.md with details of changes if needed
2. Update VERSION in mod.go if you changed functionality
3. Ensure your code follows the existing style
4. Test your changes thoroughly
5. Submit pull request with clear description

### Pull Request Title

- Feature: `feat: add new parameter for custom markers`
- Bug fix: `fix: resolve issue with large GPX files`
- Documentation: `docs: update installation instructions`
- Performance: `perf: improve rendering speed`

### Pull Request Description

```markdown
## Description
Brief description of changes made.

## Changes Made
- List specific changes
- Note any breaking changes
- Mention performance improvements

## Testing
- Tested with GPX files of various sizes
- Verified responsive design
- Checked browser compatibility

## Screenshots
Include screenshots if applicable.
```

## Reporting Bugs

When reporting bugs, please include:

1. **Hugo version**
2. **Browser and version**
3. **GPX file details** (size, format)
4. **Steps to reproduce**
5. **Expected vs actual behavior**
6. **Console errors** (if any)

Use the bug report template when creating issues.

## Feature Requests

For feature requests, please provide:

1. **Use case** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternative solutions** - Any other approaches considered?

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Follow the project's coding standards

## Questions?

Feel free to open an issue with the "question" label if you need help or have questions about contributing.

Thank you for contributing to the Hugo GPX Module! 🚀
