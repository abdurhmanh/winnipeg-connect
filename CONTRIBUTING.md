# Contributing to Winnipeg Connect

Thank you for your interest in contributing to Winnipeg Connect! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Basic knowledge of React, Node.js, and MongoDB

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/winnipeg-connect.git
   cd winnipeg-connect
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Environment Setup**
   ```bash
   cp server/.env.example server/.env
   # Edit .env with your configuration
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported
2. Create a detailed issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features
1. Check existing feature requests
2. Create an issue with:
   - Clear feature description
   - Use case and benefits
   - Proposed implementation (if any)

### Code Contributions

#### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

#### Commit Messages
Follow conventional commits:
- `feat: add user authentication`
- `fix: resolve payment processing bug`
- `docs: update API documentation`
- `style: format code with prettier`
- `refactor: restructure user service`
- `test: add unit tests for auth`

#### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes
3. Test your changes thoroughly
4. Update documentation if needed
5. Create a pull request with:
   - Clear title and description
   - Link to related issues
   - Screenshots/videos for UI changes
   - Testing instructions

## 🏗️ Development Guidelines

### Code Style
- Use TypeScript for new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic

### Frontend Guidelines
- Use functional components with hooks
- Follow Material-UI design patterns
- Implement responsive design
- Handle loading and error states

### Backend Guidelines
- Use async/await for asynchronous operations
- Implement proper error handling
- Validate input data
- Follow REST API conventions

### Database Guidelines
- Use Mongoose schemas with validation
- Implement proper indexing
- Handle database errors gracefully

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Writing Tests
- Write unit tests for new functions
- Add integration tests for API endpoints
- Test edge cases and error scenarios
- Maintain good test coverage

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex algorithms
- Include usage examples

### API Documentation
- Update API documentation for new endpoints
- Include request/response examples
- Document error codes and messages

## 🔒 Security

### Security Guidelines
- Never commit sensitive data
- Use environment variables for secrets
- Validate and sanitize user input
- Follow OWASP security practices

### Reporting Security Issues
- Email security issues privately
- Don't create public issues for vulnerabilities
- Provide detailed reproduction steps

## 📋 Code Review

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No sensitive data exposed
- [ ] Performance considerations addressed
- [ ] Accessibility guidelines followed

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address feedback and comments
4. Squash commits if requested

## 🏷️ Release Process

### Version Numbers
We follow semantic versioning (semver):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)

### Release Steps
1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Merge to main
6. Create GitHub release
7. Deploy to production

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Focus on the code, not the person

### Communication
- Use GitHub issues for bugs and features
- Join discussions respectfully
- Ask questions if you're unsure
- Share knowledge with others

## 📞 Getting Help

### Resources
- [Project Documentation](README.md)
- [API Documentation](docs/api.md)
- [GitHub Issues](https://github.com/yourusername/winnipeg-connect/issues)

### Contact
- Create an issue for technical questions
- Email maintainers for sensitive topics
- Join our community discussions

## 🎉 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Invited to maintainer team (for significant contributions)

Thank you for contributing to Winnipeg Connect! 🏠✨
