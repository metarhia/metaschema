'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must properly load Layout', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('args'), null, (error, ms) => {
    test.error(error);

    const form = ms.categories.get('Person').forms.get('ChangeDOB').definition;
    test.strictSame(form.Layout.length, 1);

    const [tabs] = form.Layout;
    test.strictSame(metaschema.extractDecorator(tabs), 'Group');
    test.strictSame(tabs.control, 'Tabs');
    test.strictSame(tabs.name, 'tabs');
    test.strictSame(tabs.children.length, 1);

    const [tab] = tabs.children;
    test.strictSame(metaschema.extractDecorator(tab), 'Group');
    test.strictSame(tab.control, 'Tab');
    test.strictSame(tab.name, 'tab');
    test.strictSame(tab.children.length, 1);

    const [group] = tab.children;
    test.strictSame(metaschema.extractDecorator(group), 'Group');
    test.strictSame(group.name, 'group');
    test.strictSame(group.children.length, 5);

    const [oldDOB, newDOB, lastName, person, personName] = group.children;

    test.strictSame(metaschema.extractDecorator(oldDOB), 'Input');
    test.strictSame(oldDOB.name, 'OldDOB');

    test.strictSame(metaschema.extractDecorator(newDOB), 'Input');
    test.strictSame(newDOB.name, 'NewDOB');

    test.strictSame(metaschema.extractDecorator(lastName), 'Input');
    test.strictSame(lastName.name, 'LastName');
    test.strictSame(lastName.control, 'text');

    test.strictSame(metaschema.extractDecorator(person), 'Label');
    test.strictSame(person.name, 'SomeOtherPerson');
    test.strictSame(person.control, 'number');

    test.strictSame(metaschema.extractDecorator(personName), 'Label');
    test.strictSame(personName.name, 'SomeOtherPersonsLastName');

    test.end();
  });
});
