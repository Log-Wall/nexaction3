/* global */
//import crypto from "crypto";

const CreateTrigger = ({
  regex,
  action,
  id,
  tags,
  enabled,
  once,
  duration,
}) => {
  let timer = false;
  if (duration) {
    timer = setTimeout(() => {
      globalThis.nexAction.triggers.remove(id);
    }, duration);
  }
  let reflexId = "";
  if (id) {
    reflexId = id;
  } else if (action.name !== "action") {
    reflexId = action.name;
  } else {
    reflexId = regex.source;
  }

  return {
    regex: regex,
    action: action,
    id: reflexId,
    tags: tags,
    enabled: enabled,
    once: once,
    timer: timer,
  };
};

const CreateHandler = () => {
  const reflexes = [];

  const add = ({
    regex,
    action,
    id = crypto.randomUUID(),
    tags = [],
    enabled = true,
    once = false,
    duration = false,
  }) => {
    if (reflexes.find((e) => e.id === id)) {
      console.log(
        `[nexAction] Attempted to create reflex with non-unique ID ${id} reassigning to UUID`
      );
      id = crypto.randomUUID();
    }
    reflexes.push(
      CreateTrigger({ regex, action, id, tags, enabled, once, duration })
    );
  };

  const remove = (id) => {
    const destroy = (index) => {
      clearTimeout(reflexes[index].timer);
      reflexes.splice(index, 1);
    };

    if (typeof id === "string") {
      let index = reflexes.findIndex((e) => e.id === id);
      if (index >= 0) {
        destroy(index);
      }
    } else if (Number.isInteger(id)) {
      destroy(id);
    } else if (id instanceof RegExp) {
      let index = reflexes.findIndex((e) => e.reflex.source === id.source);
      if (index >= 0) {
        destroy(index);
      }
    }
  };

  const process = (text) => {
    for (const reflex of reflexes) {
      if (reflex.enabled === false) {
        continue;
      }

      const args = text.match(reflex.regex);
      if (args) {
        try {
          reflex.action(args);
        } catch (error) {
          console.log(reflex?.tags);
          console.log(reflex.regex);
          console.log(error);
        }

        if (reflex.once) {
          remove(reflex.id ?? reflex.regex);
        }
      }
    }
  };

  const clear = () => {
    reflexes.forEach((reflex) => {
      clearTimeout(reflex.timer);
    });
    reflexes.length = 0;
  };

  const enable = (identifier) => {
    if (Array.isArray(identifier)) {
      reflexes
        .filter((reflex) =>
          identifier.every((tag) => reflex.tags.indexOf(tag) > -1)
        )
        .forEach((e) => (e.enabled = true));
    } else {
      reflexes.filter((e) => e.id === id).forEach((e) => (e.enabled = true));
    }
  };

  const disable = (identifier) => {
    if (Array.isArray(identifier)) {
      reflexes
        .filter((reflex) =>
          identifier.every((tag) => reflex.tags.indexOf(tag) > -1)
        )
        .forEach((e) => (e.enabled = false));
    } else {
      reflexes.filter((e) => e.id === id).forEach((e) => (e.enabled = false));
    }
  };

  return {
    reflexes: reflexes,
    add: add,
    remove: remove,
    process: process,
    clear: clear,
    enable: enable,
    disable: disable,
  };
};

globalThis.nexAction = {
  triggers: CreateHandler(),
  aliases: CreateHandler(),
};

/*
{
  reflex: /^You're not currently traversing to any location\.$/,
  action: () => {
    if (nexmap.walker.pathing) {
      nexusclient.current_line.gag = true;
    }
  },
}
*/
