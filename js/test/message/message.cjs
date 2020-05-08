function message(class_type) {
    const type = class_type.toString().slice(0, class_type.toString().search(/ /));

    return "testing " + class_type.name + " " + type + " ...";
}

exports.message = message;
