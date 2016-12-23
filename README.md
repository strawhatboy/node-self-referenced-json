# node-self-referenced-json
load self referenced json

1. use $() to add a value reference
2. use &() to add a real reference
3. use {{}} (mustache) to add a reference as a string

## $()
```
{
    "propA": 20,
    "propB": "$(propA)"
}

// returns 
{
    propA: 20,
    propB: 20
}
```


## &()
```
{
    "propA": { "propInsideA": 20 },
    "propB": "&(propA)"
}

// returns
{
    propA: { propInsideA: 20 },
    propB: { propInsideA: 20 }  // if you change the propB.propInsideA, propA.propInsideA will also be changed.
}
```


## {{}}
same as mustache
```
{
    "propA": 20,
    "propB": "the value is {{propA}}"
}

// returns
{
    propA: 20,
    propB: "the value is 20"
}