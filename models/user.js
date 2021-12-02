const { hash, compare } = require('bcrypt');
const { randomBytes } = require('crypto');

exports.signup = (dependencies) => {
  const { db } = dependencies;

  return (req, res, next) => {
    if (!req.body.password || !req.body.username) {
      res.status(400).json({ error: 'username and password needed' });
    }
    const user = {
      username: req.body.username, password: req.body.password,
    };

    const registerUser = async () => {
      user.password_digest = await hash(user.password, 10);
      delete user.password;
      user.token = randomBytes(16).toString('base64');
      const token = await db.insert([user], ['token']).into('users');
      res.status(201).json(token);
    };

    registerUser().catch(next);
  };
};

exports.login = (dependencies) => {
  const { db } = dependencies;

  return (req, res, next) => {
    const loginUser = async () => {
      // What happens if username isn’t found?
      const [{ password_digest: passwordDigest, username, id }] = await db('users').where('username', req.body.username);
      if (await compare(req.body.password, passwordDigest)) {
        const token = randomBytes(16).toString('base64');
        await db('users').where('username', username).update({ token });
        req.session.userId = id;
        return res.redirect('/');
      }
      return res.status(401).send('password wrong');
    };

    loginUser().catch(next);
  };
};
