const Bookshelf = require('./config/database')
const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const _ = require('lodash')

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); 

const User = Bookshelf.Model.extend({
    tableName: 'users'
})

const Post = Bookshelf.Model.extend({
    tablename: 'posts',
    hasTimestamps: true,
    category: function(){
        return this.belongsTo(Category, 'category_id')
    },
    tags: function(){
        return this.belongsToMany(Tag)
    },
    author: function(){
        return this.belongsTo(User)
    }
})

const Category = Bookshelf.Model.extend({
    tableName: 'categories',
    posts: function(){
        return this.hasMany(Post, 'category_id')
    }
})

const Tag = Bookshelf.Model.extend({
    tableName: 'tags',
    posts: function(){
        return this.belongsToMany(Post)
    }
})

const Users = Bookshelf.Collection.extend({
    model: User
})
const Posts = Bookshelf.Collection.extend({
    model: Post
})
const Categories = Bookshelf.Collection.extend({
    model: Category
})
const Tags = Bookshelf.Collection.extend({
    model: Tag
})

//get all users
router.get('/users',(req,res)=>{
    Users.forge().fetch().then(collection=>{
        res.json({success: true, data: collection})
    }).catch(err=>{
        res.status(500).json({success: false, data: {message: err.message}})
    })
    
})

router.post('/users', (req,res)=>{
    User.forge({
        name: req.body.name,
        email: req.body.email
    })
    .save()
    .then(user=>{
        res.json({success: true, data: {id: user.get('id')}})
    })
    .catch(err=>{
        res.status(500).json({success: false, data: {message: err.message}})
    })

})

router.get('/users/:id', (req,res)=>{
    // fetch user
    User.forge({id: req.params.id})
    .fetch()
    .then(user=>{
        if (!user) {
            res.status(404).json({error: true, data: {}})
        }
        else {
            res.json({error: false, data: user.toJSON()})
        }
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    })
})
//update user
router.put('/users/:id', (req,res)=>{
    User.forge({id: req.params.id})
    .fetch({require: true})
    .then(user=>{
        user.save({
            name: req.body.name || user.get('name'),
            email: req.body.email || user.get('email')
        })
        .then(()=>{
            res.json({error: false, data: {message: 'User details updated'}});
        })
        .catch(err=>{
            res.status(500).json({error: true, data: {message: err.message}});
        })
    })
})

//update user
router.delete('/users/:id', (req,res)=>{
    User.forge({id: req.params.id})
    .fetch({require: true})
    .then(user=>{
        user.destroy()
        .then(()=>{
            res.json({error: true, data: {message: 'User successfully deleted'}});
        })
        .catch(err=>{
            res.status(500).json({error: true, data: {message: err.message}});
        })
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    })
})

// fetch all categories
router.get('/categories', (req,res)=>{
    Categories.forge()
    .fetch()
    .then(collection=>{
        res.json({error: false, data: collection.toJSON()});
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    })
})

// create a new category
router.post('/categories', (req,res)=>{
    Category.forge({name: req.body.name})
    .save()
    .then(category=>{
        res.json({error: false, data: {id: category.get('id')}});
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    })
})

// fetch all categories
router.get('/categories/:id', (req,res)=>{
    Category.forge({id: req.params.id})
    .fetch()
    .then(category=>{
        if(!category) {
            res.status(404).json({error: true, data: {}})
        }
        else {
            res.json({error: false, data: category.toJSON()})
        }
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    });
})

// update a category
router.put('/categories/:id', (req,res)=>{
    Category.forge({id: req.params.id})
    .fetch({require: true})
    .then(category=>{
        category.save({name: req.body.name || category.get('name')})
        .then(()=>{
            res.json({error: false, data: {message: 'Category updated'}});
        })
        .catch(err=>{
            res.status(500).json({error: true, data: {message: err.message}});
        })
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    })
})

// delete a category
router.delete('/categories/:id', (req,res)=>{
    Category.forge({id: req.params.id})
    .fetch({require: true})
    .then(category=>{
        category.destroy()
        .then(()=>{
            res.json({error: true, data: {message: 'Category successfully deleted'}});
        })
        .catch(err=>{
            res.status(500).json({error: true, data: {message: err.message}});
        });
    })
    .catch(err=>{
      res.status(500).json({error: true, data: {message: err.message}});
    });
})

//fetch all posts
router.get('/posts', (req,res)=>{
   
    Posts.forge()
    .fetch()
    .then(collection=>{
        res.json({error: false, data: collection.toJSON()});
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    });
})

//fetch a post by id
router.get('/posts/:id', (req,res)=>{
    Post.forge({id: req.params.id})
    .fetch({withRelated: ['category', 'tags']})
    .then(post=>{
      if (!post) {
        res.status(404).json({error: true, data: {}});
      }
      else {
        res.json({error: false, data: post.toJSON()});
      }
    })
    .catch(err=>{
      res.status(500).json({error: true, data: {message: err.message}});
    });
})

//create a post
router.post('/posts', (req,res)=>{
    let tags = req.body.tags;
   
   // parse tags variable
    if (tags) {
        tags = tags.split(',').map(tag=>{
            return tag.trim();
        });
    }
    else {
      tags = ['uncategorised'];
    }
    
    // save post variables
    Post.forge({
        user_id: req.body.user_id,
        category_id: req.body.category_id,
        title: req.body.title,
        slug: req.body.title.replace(/ /g, '-').toLowerCase(),
        html: req.body.post
    })
    .save()
    .then(post=>{
      
        // post successfully saved
        // save tags
        saveTags(tags)
        .then(ids=>{
            post.load(['tags'])
            .then(model=>{
            
                // attach tags to post
                model.tags().attach(ids);
                res.json({error: false, data: {message: 'Tags saved'}});
            })
            .catch(err=>{
                res.status(500).json({error: true, data: {message: err.message}});
            });
        })
        .catch(err=>{
            res.status(500).json({error: true, data: {message: err.message}}); 
        });      
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    });
})

function saveTags(){
    var tagObjects = tags.map(function (tag) {
        return {
            name: tag,
            slug: tag.replace(/ /g, '-').toLowerCase()
        };
    });
    return Tags.forge()
    // fetch tags that already exist
    .query('whereIn', 'slug', _.pluck(tagObjects, 'slug'))
    .fetch()
    .then(existingTags=>{
        let doNotExist = [];
        existingTags = existingTags.toJSON();
        
        // filter out existing tags
        if (existingTags.length > 0) {
            const existingSlugs = _.pluck(existingTags, 'slug');
            doNotExist = tagObjects.filter(t=>{
                return existingSlugs.indexOf(t.slug) < 0;
            });
        }else{
            doNotExist = tagObjects;
        }
        
        // save tags that do not exist
        return new Tags(doNotExist).mapThen(model=>{
            return model.save()
            .then(function() {
                return model.get('id');
            });
        })
        // return ids of all passed tags
        .then(function (ids) {
            return _.union(ids, _.pluck(existingTags, 'id'));
        });
    });   
}

router.get('/posts/category/:id', (req,res)=>{
    Category.forge({id: req.params.id})
    .fetch({withRelated: ['posts']})
    .then(category=>{
        const posts = category.related('posts')
        res.json({error: false, data: posts.toJSON()})
    })
    .catch(err=>{
        req.status(500).json({error: true, data: {message: err.message}})
    })
})

router.get('/posts/tag/:slug', (req,res)=>{
    Tag.forge({slug: req.params.slug})
    .fetch({withRelated: ['posts']})
    .then(tag=>{
        var posts = tag.related('posts');
        res.json({error: false, data: posts.toJSON()});
    })
    .catch(err=>{
        res.status(500).json({error: true, data: {message: err.message}});
    });
})

app.use('/api', router);
app.listen(3000, function() {
  console.log("✔ Express server listening on port %d in %s mode", 3000, app.get('env'));
});









