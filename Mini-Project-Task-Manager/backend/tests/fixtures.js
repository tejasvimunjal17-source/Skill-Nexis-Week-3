// Shared TEST helpers (this file is not a test itself).
// FakeTask is an in-memory stand-in for the MongoDB Task model. matches() is a tiny re-implementation of
// the few MongoDB filter features this project uses (equality, regular expressions, $or).
// It is NOT MongoDB, so tests using it are simulations, not real database tests.

const matches = (doc, filter) =>
  Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((part) => matches(doc, part));
    if (value instanceof RegExp) return typeof doc[key] === 'string' && value.test(doc[key]);
    // Any other object here would be a MongoDB operator (e.g. {$ne: ...}); real filters must never contain one.
    if (value && typeof value === 'object') {
      throw new Error(`Unsupported/unsafe value reached the database filter: ${JSON.stringify(value)}`);
    }
    return String(doc[key]) === String(value);
  });

const makeFakeTask = () => {
  const docs = [];
  const calls = [];
  let counter = 0;
  const copy = (d) => (d ? { ...d } : null);
  const model = {
    docs,
    calls,
    async create(data) {
      calls.push(['create', data]);
      counter += 1;
      const doc = {
        status: 'todo', priority: 'medium', description: '',
        ...data,
        _id: String(counter).padStart(24, '0'),
        createdAt: new Date(counter * 1000),
      };
      docs.push(doc);
      return copy(doc);
    },
    find(filter) {
      calls.push(['find', filter]);
      return {
        sort: async () => docs.filter((d) => matches(d, filter)).sort((a, b) => b.createdAt - a.createdAt).map(copy),
      };
    },
    async countDocuments(filter) {
      calls.push(['countDocuments', filter]);
      return docs.filter((d) => matches(d, filter)).length;
    },
    async findOne(filter) {
      calls.push(['findOne', filter]);
      return copy(docs.find((d) => matches(d, filter)));
    },
    async findOneAndUpdate(filter, update) {
      calls.push(['findOneAndUpdate', filter, update]);
      const doc = docs.find((d) => matches(d, filter));
      if (!doc) return null;
      Object.assign(doc, update);
      return copy(doc);
    },
    async findOneAndDelete(filter) {
      calls.push(['findOneAndDelete', filter]);
      const index = docs.findIndex((d) => matches(d, filter));
      if (index === -1) return null;
      return copy(docs.splice(index, 1)[0]);
    },
  };
  return model;
};

module.exports = { matches, makeFakeTask };
