require('file?name=[name].[ext]!../node_modules/neo4j-driver/lib/browser/neo4j-web.min.js');
var Movie = require('./models/Movie');
var MovieCast = require('./models/MovieCast');
var _ = require('lodash');

var neo4j = window.neo4j.v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "qwerty"));

function searchMovies(queryString) {
    var session = driver.session();
    return session
        .run(
            'MATCH (movie:Movie) \
            WHERE movie.title =~ {title} \
            RETURN movie',
            {title: '(?i).*' + queryString + '.*'}
        )
        .then(result => {
            session.close();
            return result.records.map(record => {
                return new Movie(record.get('movie'));
            });
        })
        .catch(error => {
            session.close();
            throw error;
        });
}

function getMovie(title) {
    var session = driver.session();
    return session
        .run(
            "MATCH (movie:Movie {title:{title}}) \
            OPTIONAL MATCH (movie)<-[r]-(person:Person) \
            RETURN movie.title AS title, \
            collect([person.name, \
                 head(split(lower(type(r)), '_')), r.roles]) AS cast \
            LIMIT 1", {title})
        .then(result => {
            session.close();

            if (_.isEmpty(result.records))
                return null;

            var record = result.records[0];
            return new MovieCast(record.get('title'), record.get('cast'));
        })
        .catch(error => {
            session.close();
            throw error;
        });
}

function getPerson(name) {
    let session = driver.session();
    return session.run('MATCH (p:Person{name:{title}})-[:ACTS_IN]-(a:Movie) RETURN p.name as person,collect(a.title) as movies LIMIT 50', {title: name})
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                nodes.push({title: res.get('person'), label: 'actor'});
                var target = i;
                i++;

                res.get('movies').forEach(name => {
                    var movie = {title: name, label: 'movie'};
                    var source = _.findIndex(nodes, movie);
                    if (source == -1) {
                        nodes.push(movie);
                        source = i;
                        i++;
                    }
                    rels.push({source, target})
                })
            });

            return {nodes, links: rels};
        })
}

function getPersonInfo(name) {
    let session = driver.session();
    return session.run('MATCH (p:Person{name:{title}}) RETURN p.birthday as birthday, p.name as name, p.biography as biography', {title: name})
        .then(results => {
            session.close();
            let person_info;
            results.records.forEach(res => {
                person_info = {
                    birthday: res.get('birthday'),
                    name: res.get('name'),
                    biography: res.get('biography')
                };
            });
            return person_info;
        })
}

function getPersonRoles(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:ACTS_IN]-(a:Movie) RETURN a.title as movie,a.releaseDate as year,r.name as role LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({title: res.get('movie'), year: res.get('year'), role: res.get('role')});
            });

            return tuples;
        })
}

function getPersonDirectedMovies(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.title as movies,a.releaseDate as year LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({title: res.get('movies'), year: res.get('year')});
            });

            return tuples;
        })
}

function getGenres(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.genre as genre, count(*) as count LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({genre: res.get('genre'), count: res.get('count')});
            });

            return tuples;
        })
}

function getLanguages(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.language as language, count(*) as count LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({language: res.get('language'), count: res.get('count')});
            });

            return tuples;
        })
}

function getCoworkers(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(m:Movie)-[]-(a:Actor) RETURN a.name as name, count(*) as count ORDER BY count DESC", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({name: res.get('name'), count: res.get('count')});
            });

            return tuples;
        })
}

function getGraph(limit) {
    var session = driver.session();
    return session.run(
        'MATCH (m:Movie)<-[:ACTS_IN]-(a:Person) RETURN m.title AS movie, collect(a.name) AS cast LIMIT {limit}', {limit})
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                nodes.push({title: res.get('movie'), label: 'movie'});
                var target = i;
                i++;

                res.get('cast').forEach(name => {
                    var actor = {title: name, label: 'actor'};
                    var source = _.findIndex(nodes, actor);
                    if (source == -1) {
                        nodes.push(actor);
                        source = i;
                        i++;
                    }
                    rels.push({source, target})
                })
            });

            return {nodes, links: rels};
        });
}

exports.searchMovies = searchMovies;
exports.getMovie = getMovie;
exports.getPerson = getPerson;
exports.getPersonRoles = getPersonRoles;
exports.getPersonDirectedMovies = getPersonDirectedMovies;
exports.getGenres = getGenres;
exports.getLanguages = getLanguages;
exports.getCoworkers = getCoworkers;
exports.getPersonInfo = getPersonInfo;
exports.getGraph = getGraph;

