const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const connection = require('./database');

passport.serializeUser((user, done) => {
    done(null, user.ID_User);
});

passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM user WHERE ID_User = ?';
    connection.query(query, [id], (error, results) => {
        if (error) return done(error);
        done(null, results[0]);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/google/callback",
    passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Cek apakah user sudah ada
        const query = 'SELECT * FROM user WHERE Email = ?';
        connection.query(query, [profile.emails[0].value], async (error, results) => {
            if (error) return done(error);

            if (results.length > 0) {
                // User sudah ada
                return done(null, results[0]);
            }

            // Buat user baru
            const insertQuery = `
                INSERT INTO user (Nama, Email, Role, Password) 
                VALUES (?, ?, 'User', '')
            `;
            
            connection.query(insertQuery, 
                [profile.displayName, profile.emails[0].value],
                (error, results) => {
                    if (error) return done(error);

                    const newUser = {
                        ID_User: results.insertId,
                        Nama: profile.displayName,
                        Email: profile.emails[0].value,
                        Role: 'User'
                    };

                    // Log aktivitas
                    const logQuery = `
                        INSERT INTO log_aktivitas (ID_User, Aksi) 
                        VALUES (?, ?)
                    `;
                    connection.query(logQuery, [
                        results.insertId,
                        `User baru terdaftar via Google: ${profile.emails[0].value}`
                    ]);

                    done(null, newUser);
                }
            );
        });
    } catch (error) {
        done(error, null);
    }
}));

module.exports = passport;