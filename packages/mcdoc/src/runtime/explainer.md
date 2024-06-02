# Mcdoc runtime explainer

We start with a simple example, trying to see if the following JSON is assignable to `Foo`. We expect an type mismatch error on the `4`.
```json
{"hello": 4}
```
```rs
struct Foo {
  hello: string,
}
```

The runtime value (the JSON in this example) will be evaluated in a breadth-first way. Nodes are stored in a queue of type `EntryNode[]`. The root has the following data:

```yaml
parent: null
typeDef: <Foo>
possibleRuntimeValues:
  - entryNode: <parent>
    node:
      originalNode: {"hello": 4}
      inferredType: struct {}
    validDefinitions: []
```

Entries are popped from the front of the queue and processed until the queue is empty. At first the `check` function runs on the node which transforms the root into the following:

```yaml
parent: null
typeDef: <Foo>
possibleRuntimeValues:
  - entryNode: <parent>
    node:
      originalNode: {"hello": 4}
      inferredType: struct {}
    validDefinitions:
      - runtimeNode: <parent>
        typeDef: <Foo>
        errors: []
        children:
          - parent: <parent>
            typeDef: string
            runtimeKey:
              originalNode: "hello"
              inferredType: "hello"
            possibleRuntimeValues:
              - entryNode: <parent>
                node:
                  originalNode: 4
                  inferredType: 4
                validDefinitions: []
```

For each of the `possibleRuntimeValues` (in JSON this will always be only one value). It will ???

At the end it appends at the children of the current node to the queue to be processed. In this example only one child is appended and it is immediately processed. It starts op looking like this:

```yaml
parent: <parent>
typeDef: string
runtimeKey:
  originalNode: "hello"
  inferredType: "hello"
possibleRuntimeValues:
  - entryNode: <parent>
    node:
      originalNode: 4
      inferredType: 4
    validDefinitions: []
```

It is transformed into:

```yaml
parent: <parent>
typeDef: string
runtimeKey:
  originalNode: "hello"
  inferredType: "hello"
possibleRuntimeValues:
  - entryNode: <parent>
    node:
      originalNode: 4
      inferredType: 4
    validDefinitions:
      - runtimeNode: <parent>
        typeDef: "string"
        errors:
          - kind: type_mismatch
        children: []
```
