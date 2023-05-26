class A implements FooBar {

    public int foo() {

        if (oldFeatureFlag) {
            // do something
            return 0;
        } else {
            // do something else
            return 1;
        }

    }

    public void anotherMethod() { return; }

}